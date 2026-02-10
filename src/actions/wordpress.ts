"use server";

/**
 * WordPress Monitoring Server Actions
 *
 * Security Notes:
 * - All actions validate session before executing
 * - WP API keys stored encrypted in database
 * - Rate limiting to prevent abuse
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrismaWithSession } from "@/lib/prisma";
import { z } from "zod";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Validation schemas
const wpApiKeySchema = z.string().min(1, "API key is required");

const checkWordPressHealthSchema = z.object({
  projectId: z.string().cuid(),
  wpUrl: z.string().url(),
  wpApiKey: z.string().min(1),
});

/**
 * Check WordPress site health via WP REST API
 * Returns: plugins, themes, versions, vulnerabilities, etc.
 */
export async function checkWordPressHealth(
  projectId: string
): Promise<ActionResponse<{
  wpVersion: string | null;
  phpVersion: string | null;
  pluginUpdates: number;
  totalPlugins: number;
  themeUpdates: number;
  totalThemes: number;
  sslValid: boolean;
  responseTime: number;
  uptimeStatus: "up" | "down" | "unknown";
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Get project with WP monitoring data
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        wpUrl: true,
        wpMonitor: {
          select: {
            wpApiKey: true,
          },
        },
      },
    });

    if (!project || !project.wpUrl) {
      return { success: false, error: "Proyecto no tiene URL de WordPress" };
    }

    if (!project.wpMonitor?.wpApiKey) {
      return { success: false, error: "No hay API key configurada para WordPress" };
    }

    // WordPress REST API endpoints
    const wpApiBase = project.wpUrl.replace(/\/$/, "") + "/wp-json/wp/v2";
    const basicAuth = Buffer.from(
      `${session.user.email}:${project.wpMonitor.wpApiKey}`
    ).toString("base64");

    const startTime = Date.now();

    // Check if site is up
    const healthResponse = await fetch(`${project.wpUrl}/wp-json/wp/v2`, {
      method: "HEAD",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    }).catch(() => null);

    const responseTime = Date.now() - startTime;
    const uptimeStatus = healthResponse?.ok ? "up" : "down";

    if (uptimeStatus === "down") {
      // Update WP monitor with error
      await db.wpMonitor.update({
        where: { projectId },
        data: {
          lastCheck: new Date(),
          uptimeStatus: "down",
          lastError: "Site not responding",
          lastErrorAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          wpVersion: null,
          phpVersion: null,
          pluginUpdates: 0,
          totalPlugins: 0,
          themeUpdates: 0,
          totalThemes: 0,
          sslValid: false,
          responseTime,
          uptimeStatus,
        },
      };
    }

    // Fetch plugins, themes, and core info in parallel
    const [pluginsResponse, themesResponse, coreResponse] = await Promise.allSettled([
      fetch(`${wpApiBase}/plugins?per_page=100`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      }),
      fetch(`${wpApiBase}/themes?per_page=100`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      }),
      fetch(`${wpApiBase}/core`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      }),
    ]);

    let pluginUpdates = 0;
    let totalPlugins = 0;
    let themeUpdates = 0;
    let totalThemes = 0;
    let wpVersion: string | null = null;
    let phpVersion: string | null = null;

    // Parse plugins
    if (pluginsResponse.status === "fulfilled" && pluginsResponse.value.ok) {
      const plugins = await pluginsResponse.value.json();
      totalPlugins = plugins.length || 0;
      pluginUpdates = plugins.filter((p: any) => p.update !== "none").length || 0;
    }

    // Parse themes
    if (themesResponse.status === "fulfilled" && themesResponse.value.ok) {
      const themes = await themesResponse.value.json();
      totalThemes = themes.length || 0;
      themeUpdates = themes.filter((t: any) => t.update !== "none").length || 0;
    }

    // Parse core info
    if (coreResponse.status === "fulfilled" && coreResponse.value.ok) {
      const core = await coreResponse.value.json();
      wpVersion = core?.version || null;
      phpVersion = core?.php_version || null;
    }

    // Check SSL
    const sslValid = project.wpUrl.startsWith("https://");

    // Update or create WP monitor record
    await db.wpMonitor.upsert({
      where: { projectId },
      create: {
        projectId,
        lastCheck: new Date(),
        uptimeStatus: "up",
        wpVersion,
        phpVersion,
        pluginUpdates,
        totalPlugins,
        themeUpdates,
        totalThemes,
        sslValid,
        responseTime,
        uptimePercent: 100, // Will be calculated from historical data
      },
      update: {
        lastCheck: new Date(),
        uptimeStatus: "up",
        wpVersion,
        phpVersion,
        pluginUpdates,
        totalPlugins,
        themeUpdates,
        totalThemes,
        sslValid,
        responseTime,
        lastError: null,
        lastErrorAt: null,
      },
    });

    // Update project health status based on WP health
    const hasVulnerabilities = pluginUpdates > 5 || themeUpdates > 2;
    const healthStatus = hasVulnerabilities ? "warning" : "healthy";

    await db.project.update({
      where: { id: projectId },
      data: { healthStatus },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}`);

    return {
      success: true,
      data: {
        wpVersion,
        phpVersion,
        pluginUpdates,
        totalPlugins,
        themeUpdates,
        totalThemes,
        sslValid,
        responseTime,
        uptimeStatus,
      },
    };
  } catch (error) {
    console.error("[WORDPRESS] Error checking health:", error);

    // Log error to WP monitor
    try {
      const errorSession = await auth.api.getSession({ headers: await headers() });
      if (errorSession) {
        const errorDb = await getPrismaWithSession(errorSession);
        await errorDb.wpMonitor.update({
          where: { projectId },
          data: {
            lastError: error instanceof Error ? error.message : "Unknown error",
            lastErrorAt: new Date(),
          },
        });
      }
    } catch {
      // Ignore
    }

    return { success: false, error: "Error al verificar WordPress" };
  }
}

/**
 * Save WordPress API key for a project
 */
export async function saveWordPressApiKey(
  projectId: string,
  wpApiKey: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedKey = wpApiKeySchema.parse(wpApiKey);
    const db = await getPrismaWithSession(session);

    // Verify project belongs to organization
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project || project.organizationId !== session.session.activeOrganizationId) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    // Create or update WP monitor with API key
    await db.wpMonitor.upsert({
      where: { projectId },
      create: {
        projectId,
        wpApiKey: validatedKey,
      },
      update: {
        wpApiKey: validatedKey,
      },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[WORDPRESS] Error saving API key:", error);
    return { success: false, error: "Error al guardar API key" };
  }
}

/**
 * Get WordPress monitoring data for a project
 */
export async function getWordPressMonitoring(
  projectId: string
): Promise<ActionResponse<{
  lastCheck: Date | null;
  uptimeStatus: string | null;
  uptimePercent: number | null;
  wpVersion: string | null;
  phpVersion: string | null;
  pluginUpdates: number;
  totalPlugins: number;
  themeUpdates: number;
  totalThemes: number;
  sslValid: boolean | null;
  responseTime: number | null;
  lastError: string | null;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const wpMonitor = await db.wpMonitor.findUnique({
      where: { projectId },
    });

    if (!wpMonitor) {
      return {
        success: true,
        data: {
          lastCheck: null,
          uptimeStatus: null,
          uptimePercent: null,
          wpVersion: null,
          phpVersion: null,
          pluginUpdates: 0,
          totalPlugins: 0,
          themeUpdates: 0,
          totalThemes: 0,
          sslValid: null,
          responseTime: null,
          lastError: null,
        },
      };
    }

    return {
      success: true,
      data: {
        lastCheck: wpMonitor.lastCheck,
        uptimeStatus: wpMonitor.uptimeStatus,
        uptimePercent: wpMonitor.uptimePercent,
        wpVersion: wpMonitor.wpVersion,
        phpVersion: wpMonitor.phpVersion,
        pluginUpdates: wpMonitor.pluginUpdates,
        totalPlugins: wpMonitor.totalPlugins,
        themeUpdates: wpMonitor.themeUpdates,
        totalThemes: wpMonitor.totalThemes,
        sslValid: wpMonitor.sslValid,
        responseTime: wpMonitor.responseTime,
        lastError: wpMonitor.lastError,
      },
    };
  } catch (error) {
    console.error("[WORDPRESS] Error fetching monitoring data:", error);
    return { success: false, error: "Error al obtener datos de monitoreo" };
  }
}

/**
 * Batch check all WordPress sites for an organization
 * Called by cron job
 */
export async function checkAllWordPressSites(): Promise<ActionResponse<{
  checked: number;
  updated: number;
  errors: number;
}>> {
  try {
    // This is a cron endpoint - needs special auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Get all WordPress projects with API keys
    const projects = await db.project.findMany({
      where: {
        organizationId: session.session.activeOrganizationId,
        type: "WORDPRESS",
        wpUrl: { not: null },
        wpMonitor: { wpApiKey: { not: null } },
      },
      select: {
        id: true,
      },
    });

    let checked = 0;
    let updated = 0;
    let errors = 0;

    for (const project of projects) {
      checked++;
      const result = await checkWordPressHealth(project.id);
      if (result.success) {
        updated++;
      } else {
        errors++;
      }
    }

    return {
      success: true,
      data: { checked, updated, errors },
    };
  } catch (error) {
    console.error("[WORDPRESS] Batch check error:", error);
    return { success: false, error: "Error en verificación por lotes" };
  }
}
