"use server";

/**
 * Client Server Actions
 *
 * Security Notes:
 * - All actions validate session before executing
 * - All actions validate activeOrganizationId
 * - Input validated with Zod schemas
 * - Prisma middleware ensures tenant isolation
 * - No direct database access without session context
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { getPrismaWithSession, prisma } from "@/lib/prisma";
import {
  createClientSchema,
  updateClientSchema,
  clientFilterSchema,
  type CreateClientInput,
  type UpdateClientInput,
  type ClientFilter,
} from "@/lib/validations/client";

type OperationalField =
  | "clientCode"
  | "projectType"
  | "funnelStage"
  | "techStack"
  | "nextFollowUp"
  | "painPoints"
  | "projectFolderUrl";

const OPERATIONAL_FIELDS: OperationalField[] = [
  "clientCode",
  "projectType",
  "funnelStage",
  "techStack",
  "nextFollowUp",
  "painPoints",
  "projectFolderUrl",
];

type OperationalInput = Partial<Record<OperationalField, string | undefined>>;

function sanitizeStringValue(value?: string | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function buildOperationalCustomData(input: Partial<Record<OperationalField, unknown>>) {
  const result: Record<string, string> = {};

  for (const key of OPERATIONAL_FIELDS) {
    const rawValue = input[key];

    if (typeof rawValue === "string") {
      const sanitized = sanitizeStringValue(rawValue);
      if (sanitized) {
        result[key] = sanitized;
      }
    } else if (typeof rawValue === "number" || rawValue instanceof Date) {
      result[key] = String(rawValue);
    }
  }

  return result;
}

function mergeOperationalCustomData(
  existing: Record<string, unknown> | null | undefined,
  updates: Record<string, string>,
  rawInput: Partial<Record<OperationalField, unknown>>
) {
  const next: Record<string, unknown> = { ...(existing ?? {}) };

  for (const key of OPERATIONAL_FIELDS) {
    if (!(key in rawInput)) continue;
    const value = updates[key];
    if (value !== undefined) {
      next[key] = value;
    } else {
      delete next[key];
    }
  }

  return next;
}

// Response types
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all clients for the current organization
 */
export async function getClients(
  filter?: Partial<ClientFilter>
): Promise<ActionResponse<{
  clients: Awaited<ReturnType<typeof prisma.client.findMany>>;
  total: number;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Parse and validate filter
    const validatedFilter = clientFilterSchema.partial().parse(filter || {});
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc", status, search, tags, source } = validatedFilter;

    // Build where clause
    const where: Prisma.ClientWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    if (source) {
      where.source = source;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Execute queries
    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.client.count({ where }),
    ]);

    return {
      success: true,
      data: { clients, total },
    };
  } catch (error) {
    console.error("[CLIENTS] Error fetching clients:", error);
    return { success: false, error: "Error al obtener clientes" };
  }
}

/**
 * Get a single client by ID
 */
export async function getClient(id: string): Promise<
  ActionResponse<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    position: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    status: string;
    source: string | null;
    tags: string[];
    notes: string | null;
    customData: unknown;
    supportToken: string | null;
    supportTokenActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deals: Array<{
      id: string;
      title: string;
      value: unknown;
      status: string;
      createdAt: Date;
    }>;
    projects: Array<{
      id: string;
      name: string;
      status: string;
      createdAt: Date;
    }>;
    activities: Array<{
      id: string;
      title: string;
      createdAt: Date;
      user: { name: string; image: string | null };
    }>;
  }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const client = await db.client.findUnique({
      where: { id },
      include: {
        deals: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        projects: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    if (!client) {
      return { success: false, error: "Cliente no encontrado" };
    }

    return { success: true, data: client };
  } catch (error) {
    console.error("[CLIENTS] Error fetching client:", error);
    return { success: false, error: "Error al obtener cliente" };
  }
}

/**
 * Create a new client
 */
export async function createClient(
  input: CreateClientInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Validate input
    const validatedData = createClientSchema.parse(input);

    const db = await getPrismaWithSession(session);

    // Check for duplicate email if provided
    if (validatedData.email) {
      const existingClient = await db.client.findFirst({
        where: { email: validatedData.email },
        select: { id: true },
      });

      if (existingClient) {
        return { success: false, error: "Ya existe un cliente con este email" };
      }
    }

    const operationalCustomData = buildOperationalCustomData(validatedData as Partial<Record<OperationalField, unknown>>);
    const combinedCustomData = {
      ...(validatedData.customData || {}),
      ...operationalCustomData,
    };
    const customDataPayload = Object.keys(combinedCustomData).length
      ? combinedCustomData
      : undefined;

    // Create client
    const client = await db.client.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        position: validatedData.position || null,
        website: validatedData.website || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country || null,
        postalCode: validatedData.postalCode || null,
        status: validatedData.status,
        source: validatedData.source || null,
        tags: validatedData.tags || [],
        notes: validatedData.notes || null,
        customData: customDataPayload,
        organizationId: session.session.activeOrganizationId!,
      },
      select: { id: true },
    });

    // Create activity log
    await db.activity.create({
      data: {
        type: "CLIENT_CREATED",
        title: `Cliente ${validatedData.name} creado`,
        clientId: client.id,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
    });

    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return { success: true, data: { id: client.id } };
  } catch (error) {
    console.error("[CLIENTS] Error creating client:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "Ya existe un cliente con este email" };
    }

    return { success: false, error: "Error al crear cliente" };
  }
}

/**
 * Update an existing client
 */
export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Validate input
    const validatedData = updateClientSchema.parse(input);

    const db = await getPrismaWithSession(session);

    // Check client exists and belongs to org (middleware handles this)
    const existingClient = await db.client.findUnique({
      where: { id },
      select: { id: true, name: true, customData: true },
    });

    if (!existingClient) {
      return { success: false, error: "Cliente no encontrado" };
    }

    // Check for duplicate email if being changed
    if (validatedData.email) {
      const duplicateClient = await db.client.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
        },
        select: { id: true },
      });

      if (duplicateClient) {
        return { success: false, error: "Ya existe un cliente con este email" };
      }
    }

    const operationalCustomData = buildOperationalCustomData(
      validatedData as Partial<Record<OperationalField, unknown>>
    );
    let mergedCustomData = mergeOperationalCustomData(
      existingClient.customData as Record<string, unknown> | null,
      operationalCustomData,
      validatedData as Partial<Record<OperationalField, unknown>>
    );

    if (validatedData.customData) {
      mergedCustomData = {
        ...mergedCustomData,
        ...validatedData.customData,
      };
    }

    // Update client
    await db.client.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.company !== undefined && { company: validatedData.company || null }),
        ...(validatedData.position !== undefined && { position: validatedData.position || null }),
        ...(validatedData.website !== undefined && { website: validatedData.website || null }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.city !== undefined && { city: validatedData.city || null }),
        ...(validatedData.state !== undefined && { state: validatedData.state || null }),
        ...(validatedData.country !== undefined && { country: validatedData.country || null }),
        ...(validatedData.postalCode !== undefined && { postalCode: validatedData.postalCode || null }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.source !== undefined && { source: validatedData.source || null }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
        customData: mergedCustomData,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[CLIENTS] Error updating client:", error);
    return { success: false, error: "Error al actualizar cliente" };
  }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Check client exists
    const existingClient = await db.client.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existingClient) {
      return { success: false, error: "Cliente no encontrado" };
    }

    // Delete client (cascades to deals, projects via Prisma)
    await db.client.delete({
      where: { id },
    });

    revalidatePath("/clients");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[CLIENTS] Error deleting client:", error);
    return { success: false, error: "Error al eliminar cliente" };
  }
}

/**
 * Get client statistics
 */
export async function getClientStats(): Promise<ActionResponse<{
  total: number;
  byStatus: Record<string, number>;
  bySources: { source: string; count: number }[];
  recentCount: number;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const [total, leads, prospects, customers, inactive, churned, recentCount] =
      await Promise.all([
        db.client.count(),
        db.client.count({ where: { status: "LEAD" } }),
        db.client.count({ where: { status: "PROSPECT" } }),
        db.client.count({ where: { status: "CUSTOMER" } }),
        db.client.count({ where: { status: "INACTIVE" } }),
        db.client.count({ where: { status: "CHURNED" } }),
        db.client.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    // Get top sources
    const clients = await db.client.findMany({
      where: { source: { not: null } },
      select: { source: true },
    });

    const sourceCounts = clients.reduce((acc, client) => {
      const source = client.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        total,
        byStatus: {
          LEAD: leads,
          PROSPECT: prospects,
          CUSTOMER: customers,
          INACTIVE: inactive,
          CHURNED: churned,
        },
        bySources,
        recentCount,
      },
    };
  } catch (error) {
    console.error("[CLIENTS] Error fetching stats:", error);
    return { success: false, error: "Error al obtener estadisticas" };
  }
}

/**
 * Generate or regenerate support token for a client
 */
export async function generateClientSupportToken(
  clientId: string
): Promise<ActionResponse<{ token: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Verify client belongs to the org
    const existing = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Cliente no encontrado" };
    }

    const token = nanoid(32);

    await db.client.update({
      where: { id: clientId },
      data: {
        supportToken: token,
        supportTokenActive: true,
      },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, data: { token } };
  } catch (error) {
    console.error("[CLIENTS] Error generating support token:", error);
    return { success: false, error: "Error al generar el token de soporte" };
  }
}

/**
 * Revoke the support token for a client
 */
export async function revokeClientSupportToken(
  clientId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const existing = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Cliente no encontrado" };
    }

    await db.client.update({
      where: { id: clientId },
      data: { supportTokenActive: false },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[CLIENTS] Error revoking support token:", error);
    return { success: false, error: "Error al revocar el token de soporte" };
  }
}
