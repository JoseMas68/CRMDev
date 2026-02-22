"use server";

/**
 * Deal Server Actions
 *
 * Security Notes:
 * - All actions validate session before executing
 * - All actions validate activeOrganizationId
 * - Input validated with Zod schemas
 * - Prisma middleware ensures tenant isolation
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrismaWithSession, prisma } from "@/lib/prisma";
import {
  createDealSchema,
  updateDealSchema,
  moveDealSchema,
  createPipelineStageSchema,
  type CreateDealInput,
  type UpdateDealInput,
  type MoveDealInput,
  type CreatePipelineStageInput,
} from "@/lib/validations/deal";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all deals grouped by stage for the Kanban board
 */
export async function getDealsForKanban(): Promise<
  ActionResponse<{
    stages: Array<{
      id: string;
      name: string;
      color: string;
      order: number;
      probability: number;
      deals: Array<{
        id: string;
        title: string;
        value: number;
        status: string;
        order: number;
        client: { id: string; name: string } | null;
        expectedCloseDate: Date | null;
      }>;
    }>;
    totalValue: number;
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

    // Get stages with deals
    const stages = await db.pipelineStage.findMany({
      orderBy: { order: "asc" },
      include: {
        deals: {
          where: { status: "OPEN" },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            order: true,
            expectedCloseDate: true,
            client: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Calculate total value of open deals
    const totalValue = stages.reduce(
      (acc, stage) =>
        acc + stage.deals.reduce((sum, deal) => sum + Number(deal.value), 0),
      0
    );

    return {
      success: true,
      data: {
        stages: stages.map((stage) => ({
          ...stage,
          deals: stage.deals.map((deal) => ({
            ...deal,
            value: Number(deal.value),
          })),
        })),
        totalValue,
      },
    };
  } catch (error) {
    console.error("[DEALS] Error fetching kanban:", error);
    return { success: false, error: "Error al obtener pipeline" };
  }
}

/**
 * Get a single deal by ID
 */
export async function getDealById(id: string): Promise<
  ActionResponse<{
    id: string;
    title: string;
    value: number;
    currency: string;
    status: string;
    stageId: string;
    notes: string | null;
    createdAt: Date;
    expectedCloseDate: Date | null;
    client: { id: string; name: string } | null;
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

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    if (!deal) {
      return { success: false, error: "Deal no encontrado" };
    }

    return {
      success: true,
      data: {
        ...deal,
        value: Number(deal.value),
      },
    };
  } catch (error) {
    console.error("[DEALS] Error fetching deal:", error);
    return { success: false, error: "Error al obtener deal" };
  }
}

/**
 * Create a new deal
 */
export async function createDeal(
  input: CreateDealInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = createDealSchema.parse(input);
    const db = await getPrismaWithSession(session);

    // Get the highest order in the stage
    const maxOrderDeal = await db.deal.findFirst({
      where: { stageId: validatedData.stageId, status: "OPEN" },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderDeal?.order ?? -1) + 1;

    const deal = await db.deal.create({
      data: {
        title: validatedData.title,
        value: validatedData.value,
        currency: validatedData.currency,
        stageId: validatedData.stageId,
        clientId: validatedData.clientId || undefined,
        expectedCloseDate: validatedData.expectedCloseDate,
        notes: validatedData.notes || null,
        order: newOrder,
        creatorId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
      select: { id: true },
    });

    // Create activity
    await db.activity.create({
      data: {
        type: "DEAL_CREATED",
        title: `Deal "${validatedData.title}" creado`,
        dealId: deal.id,
        clientId: validatedData.clientId,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, data: { id: deal.id } };
  } catch (error) {
    console.error("[DEALS] Error creating deal:", error);
    return { success: false, error: "Error al crear deal" };
  }
}

/**
 * Update a deal
 */
export async function updateDeal(
  id: string,
  input: UpdateDealInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = updateDealSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const existingDeal = await db.deal.findUnique({
      where: { id },
      select: { id: true, status: true, stageId: true },
    });

    if (!existingDeal) {
      return { success: false, error: "Deal no encontrado" };
    }

    await db.deal.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.value !== undefined && { value: validatedData.value }),
        ...(validatedData.currency && { currency: validatedData.currency }),
        ...(validatedData.stageId && { stageId: validatedData.stageId }),
        ...(validatedData.expectedCloseDate !== undefined && {
          expectedCloseDate: validatedData.expectedCloseDate,
        }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.lostReason !== undefined && {
          lostReason: validatedData.lostReason || null,
        }),
        ...(validatedData.notes !== undefined && {
          notes: validatedData.notes || null,
        }),
        ...(validatedData.closedAt !== undefined && {
          closedAt: validatedData.closedAt,
        }),
      },
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[DEALS] Error updating deal:", error);
    return { success: false, error: "Error al actualizar deal" };
  }
}

/**
 * Move a deal (drag and drop)
 */
export async function moveDeal(
  input: MoveDealInput
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = moveDealSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const deal = await db.deal.findUnique({
      where: { id: validatedData.id },
      select: { id: true, stageId: true, order: true },
    });

    if (!deal) {
      return { success: false, error: "Deal no encontrado" };
    }

    const oldStageId = deal.stageId;
    const newStageId = validatedData.stageId;
    const newOrder = validatedData.order;

    // Update the deal's stage and order
    await db.deal.update({
      where: { id: validatedData.id },
      data: {
        stageId: newStageId,
        order: newOrder,
      },
    });

    // If moving to a different stage, log activity
    if (oldStageId !== newStageId) {
      const [oldStage, newStage] = await Promise.all([
        db.pipelineStage.findUnique({
          where: { id: oldStageId },
          select: { name: true },
        }),
        db.pipelineStage.findUnique({
          where: { id: newStageId },
          select: { name: true },
        }),
      ]);

      await db.activity.create({
        data: {
          type: "DEAL_STAGE_CHANGED",
          title: `Deal movido de "${oldStage?.name}" a "${newStage?.name}"`,
          dealId: validatedData.id,
          userId: session.user.id,
          organizationId: session.session.activeOrganizationId,
          metadata: {
            fromStage: oldStageId,
            toStage: newStageId,
          },
        },
      });
    }

    revalidatePath("/pipeline");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DEALS] Error moving deal:", error);
    return { success: false, error: "Error al mover deal" };
  }
}

/**
 * Mark deal as won
 */
export async function markDealAsWon(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const deal = await db.deal.findUnique({
      where: { id },
      select: { id: true, title: true, clientId: true },
    });

    if (!deal) {
      return { success: false, error: "Deal no encontrado" };
    }

    await db.deal.update({
      where: { id },
      data: {
        status: "WON",
        closedAt: new Date(),
      },
    });

    await db.activity.create({
      data: {
        type: "DEAL_WON",
        title: `Deal "${deal.title}" ganado`,
        dealId: id,
        clientId: deal.clientId,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DEALS] Error marking deal as won:", error);
    return { success: false, error: "Error al marcar deal como ganado" };
  }
}

/**
 * Mark deal as lost
 */
export async function markDealAsLost(
  id: string,
  reason?: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const deal = await db.deal.findUnique({
      where: { id },
      select: { id: true, title: true, clientId: true },
    });

    if (!deal) {
      return { success: false, error: "Deal no encontrado" };
    }

    await db.deal.update({
      where: { id },
      data: {
        status: "LOST",
        closedAt: new Date(),
        lostReason: reason || null,
      },
    });

    await db.activity.create({
      data: {
        type: "DEAL_LOST",
        title: `Deal "${deal.title}" perdido`,
        dealId: id,
        clientId: deal.clientId,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
        metadata: reason ? { reason } : undefined,
      },
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DEALS] Error marking deal as lost:", error);
    return { success: false, error: "Error al marcar deal como perdido" };
  }
}

/**
 * Create default pipeline stages for a new organization
 */
export async function createDefaultPipelineStages(): Promise<
  ActionResponse<void>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    // Check if stages already exist
    const existingStages = await db.pipelineStage.count();
    if (existingStages > 0) {
      return { success: true, data: undefined };
    }

    // Create default stages
    const defaultStages = [
      { name: "Nuevo Lead", color: "#6366f1", order: 0, probability: 10 },
      { name: "Contactado", color: "#8b5cf6", order: 1, probability: 20 },
      { name: "Calificado", color: "#0ea5e9", order: 2, probability: 40 },
      { name: "Propuesta", color: "#f59e0b", order: 3, probability: 60 },
      { name: "Negociacion", color: "#f97316", order: 4, probability: 80 },
      { name: "Cierre", color: "#22c55e", order: 5, probability: 90 },
    ];

    await db.pipelineStage.createMany({
      data: defaultStages.map((stage) => ({
        ...stage,
        organizationId: session.session.activeOrganizationId!,
      })),
    });

    // No revalidatePath aquí - esta función se llama durante render
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DEALS] Error creating default stages:", error);
    return { success: false, error: "Error al crear etapas" };
  }
}

/**
 * Create a new pipeline stage
 */
export async function createPipelineStage(
  input: CreatePipelineStageInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = createPipelineStageSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const stage = await db.pipelineStage.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        order: validatedData.order,
        probability: validatedData.probability,
        organizationId: session.session.activeOrganizationId,
      },
      select: { id: true },
    });

    revalidatePath("/pipeline");

    return { success: true, data: { id: stage.id } };
  } catch (error) {
    console.error("[DEALS] Error creating stage:", error);
    return { success: false, error: "Error al crear etapa" };
  }
}

/**
 * Delete a deal
 */
export async function deleteDeal(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const deal = await db.deal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!deal) {
      return { success: false, error: "Deal no encontrado" };
    }

    await db.deal.delete({ where: { id } });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[DEALS] Error deleting deal:", error);
    return { success: false, error: "Error al eliminar deal" };
  }
}

/**
 * Get closed deals (won and lost)
 */
export async function getClosedDeals(): Promise<
  ActionResponse<{
    won: Array<{
      id: string;
      title: string;
      value: number;
      closedAt: Date | null;
      client: { id: string; name: string } | null;
    }>;
    lost: Array<{
      id: string;
      title: string;
      value: number;
      closedAt: Date | null;
      lostReason: string | null;
      client: { id: string; name: string } | null;
    }>;
    totalWon: number;
    totalLost: number;
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

    const [wonDeals, lostDeals] = await Promise.all([
      db.deal.findMany({
        where: { status: "WON" },
        orderBy: { closedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          value: true,
          closedAt: true,
          client: {
            select: { id: true, name: true },
          },
        },
      }),
      db.deal.findMany({
        where: { status: "LOST" },
        orderBy: { closedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          value: true,
          closedAt: true,
          lostReason: true,
          client: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const totalWon = wonDeals.reduce((sum, deal) => sum + Number(deal.value), 0);
    const totalLost = lostDeals.reduce((sum, deal) => sum + Number(deal.value), 0);

    return {
      success: true,
      data: {
        won: wonDeals.map((d) => ({ ...d, value: Number(d.value) })),
        lost: lostDeals.map((d) => ({ ...d, value: Number(d.value) })),
        totalWon,
        totalLost,
      },
    };
  } catch (error) {
    console.error("[DEALS] Error fetching closed deals:", error);
    return { success: false, error: "Error al obtener deals cerrados" };
  }
}
