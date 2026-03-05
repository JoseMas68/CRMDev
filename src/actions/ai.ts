"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveOpenAIApiKey(apiKey: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    // Verificar que es owner o admin
    const member = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: activeOrganizationId,
          userId: session.user.id,
        },
      },
      select: { role: true },
    });

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return { success: false, error: "Only owners and admins can change this setting" };
    }

    // Validar formato de API key (sk-...)
    if (!apiKey.startsWith("sk-")) {
      return { success: false, error: "Invalid API key format" };
    }

    // Actualizar organización
    await prisma.organization.update({
      where: { id: activeOrganizationId },
      data: { openaiApiKey: apiKey },
    });

    return { success: true };
  } catch (error) {
    console.error("[AI_ACTION]", error);
    return { success: false, error: "Error saving API key" };
  }
}

export async function getOpenAIApiKey() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    const org = await prisma.organization.findUnique({
      where: { id: activeOrganizationId },
      select: { openaiApiKey: true },
    });

    return {
      success: true,
      data: {
        hasApiKey: !!org?.openaiApiKey,
        // Devolver solo los primeros caracteres para verificar
        preview: org?.openaiApiKey ? `${org.openaiApiKey.slice(0, 7)}...` : null,
      },
    };
  } catch (error) {
    console.error("[AI_ACTION]", error);
    return { success: false, error: "Error getting API key" };
  }
}

export async function deleteOpenAIApiKey() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    await prisma.organization.update({
      where: { id: activeOrganizationId },
      data: { openaiApiKey: null },
    });

    return { success: true };
  } catch (error) {
    console.error("[AI_ACTION]", error);
    return { success: false, error: "Error deleting API key" };
  }
}
