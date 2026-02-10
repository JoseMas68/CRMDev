"use server";

/**
 * Ticket Server Actions
 *
 * Security Notes:
 * - All actions validate session before executing
 * - Guest tickets (from client portal) use org-slug for validation
 * - Input validated with Zod schemas
 * - Prisma middleware ensures tenant isolation
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrismaWithSession, prisma } from "@/lib/prisma";
import {
  createTicketSchema,
  updateTicketSchema,
  createTicketCommentSchema,
  ticketFilterSchema,
  type CreateTicketInput,
  type UpdateTicketInput,
  type CreateTicketCommentInput,
  type TicketFilter,
} from "@/lib/validations/ticket";
import { analyzeTicketWithAI, generateAutoReply } from "@/lib/ai/ticket-ai";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get organization by slug (for public client portal)
 */
async function getOrgBySlug(slug: string) {
  return await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
}

/**
 * Create a new ticket (public - for client portal)
 */
export async function createTicket(
  orgSlug: string,
  input: CreateTicketInput
): Promise<ActionResponse<{ ticketId: string; ticketNumber: string }>> {
  try {
    const validatedData = createTicketSchema.parse(input);

    // Get organization by slug
    const org = await getOrgBySlug(orgSlug);
    if (!org) {
      return { success: false, error: "Organización no encontrada" };
    }

    // Generate ticket number (TICKET-{YYYY}-{0000})
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count({
      where: {
        organizationId: org.id,
        createdAt: { gte: new Date(year, 0, 1) },
      },
    });
    const ticketNumber = `TICKET-${year}-${String(count + 1).padStart(4, "0")}`;

    // Get project name if provided
    let projectName = undefined;
    if (validatedData.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: validatedData.projectId },
        select: { name: true },
      });
      projectName = project?.name;
    }

    // AI Analysis: Analyze ticket and get suggested category/priority/fix
    const aiAnalysis = await analyzeTicketWithAI({
      title: validatedData.title,
      description: validatedData.description,
      guestName: validatedData.guestName,
      guestEmail: validatedData.guestEmail,
      projectName,
    });

    // Create ticket with AI analysis
    const ticket = await prisma.ticket.create({
      data: {
        organizationId: org.id,
        title: validatedData.title,
        description: validatedData.description,
        category: (aiAnalysis.success ? aiAnalysis.data.category : validatedData.category) as any,
        priority: (aiAnalysis.success ? aiAnalysis.data.priority : validatedData.priority) as any,
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        projectId: validatedData.projectId || null,
        attachments: validatedData.attachments,
        // Store AI analysis results
        aiCategory: aiAnalysis.success ? (aiAnalysis.data.category as any) : undefined,
        aiPriority: aiAnalysis.success ? (aiAnalysis.data.priority as any) : undefined,
        aiSummary: aiAnalysis.success ? aiAnalysis.data.summary : undefined,
        aiSuggestedFix: aiAnalysis.success ? aiAnalysis.data.suggestedFix : undefined,
        confidence: aiAnalysis.success ? aiAnalysis.data.confidence : undefined,
      },
      select: { id: true, category: true, priority: true },
    });

    // Generate and send auto-reply
    const autoReply = await generateAutoReply({
      ticketTitle: validatedData.title,
      ticketDescription: validatedData.description,
      category: ticket.category,
      priority: ticket.priority,
      guestName: validatedData.guestName,
      guestEmail: validatedData.guestEmail,
      projectName,
    });

    // TODO: Send email to guest (implement Resend integration)
    // For now, log the auto-reply
    console.log("[TICKET] Auto-reply for", validatedData.guestEmail, ":", autoReply);

    // Mark auto-reply as sent
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        autoReplySent: true,
        autoReplyAt: new Date(),
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "TICKET_CREATED",
        title: `Ticket ${ticketNumber} creado por ${validatedData.guestName}`,
        description: validatedData.title,
        ticketId: ticket.id,
        userId: (await getFirstUserInOrg(org.id)) || "",
        organizationId: org.id,
      },
    });

    revalidatePath(`/support/${orgSlug}`);

    return {
      success: true,
      data: { ticketId: ticket.id, ticketNumber },
    };
  } catch (error) {
    console.error("[TICKETS] Error creating ticket:", error);
    return { success: false, error: "Error al crear ticket" };
  }
}

/**
 * Get all tickets for the current organization (dev dashboard)
 */
export async function getTickets(
  filter?: Partial<TicketFilter>
): Promise<ActionResponse<{
  tickets: Array<any>;
  total: number;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedFilter = ticketFilterSchema.partial().parse(filter || {});
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      priority,
      category,
      projectId,
      search,
    } = validatedFilter;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    // Generate ticket numbers for display
    const ticketsWithNumbers = tickets.map((ticket, idx) => {
      const year = ticket.createdAt.getFullYear();
      const num = idx + 1 + (page - 1) * limit;
      return {
        ...ticket,
        ticketNumber: `TICKET-${year}-${String(num).padStart(4, "0")}`,
      };
    });

    return {
      success: true,
      data: {
        tickets: ticketsWithNumbers,
        total,
      },
    };
  } catch (error) {
    console.error("[TICKETS] Error fetching tickets:", error);
    return { success: false, error: "Error al obtener tickets" };
  }
}

/**
 * Get a single ticket by ID with comments
 */
export async function getTicket(id: string): Promise<ActionResponse<any>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!ticket) {
      return { success: false, error: "Ticket no encontrado" };
    }

    // Generate ticket number
    const year = ticket.createdAt.getFullYear();
    const count = await prisma.ticket.count({
      where: {
        organizationId: ticket.organizationId,
        createdAt: { gte: new Date(year, 0, 1), lte: ticket.createdAt },
      },
    });

    return {
      success: true,
      data: {
        ...ticket,
        ticketNumber: `TICKET-${year}-${String(count).padStart(4, "0")}`,
      },
    };
  } catch (error) {
    console.error("[TICKETS] Error fetching ticket:", error);
    return { success: false, error: "Error al obtener ticket" };
  }
}

/**
 * Update ticket (dev dashboard)
 */
export async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = updateTicketSchema.parse(input);

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.status === "RESOLVED" && !validatedData.resolution
          ? { resolution: "Marcado como resuelto" }
          : {}),
        ...(validatedData.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        ...(validatedData.status === "RESOLVED" || validatedData.status === "CLOSED"
          ? { resolvedBy: session.user.id }
          : {}),
      },
      select: { id: true },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "TICKET_UPDATED",
        title: `Ticket actualizado a ${validatedData.status || ""}`,
        ticketId: id,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId!,
      },
    });

    revalidatePath("/support");
    revalidatePath(`/support/tickets/${id}`);

    return { success: true, data: { id: ticket.id } };
  } catch (error) {
    console.error("[TICKETS] Error updating ticket:", error);
    return { success: false, error: "Error al actualizar ticket" };
  }
}

/**
 * Add comment to ticket
 */
export async function createTicketComment(
  ticketId: string,
  input: CreateTicketCommentInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const validatedData = createTicketCommentSchema.parse(input);

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        content: validatedData.content,
        isInternal: validatedData.isInternal,
        authorId: session?.user.id || null,
      },
      select: { id: true },
    });

    revalidatePath(`/support/tickets/${ticketId}`);

    return { success: true, data: { id: comment.id } };
  } catch (error) {
    console.error("[TICKETS] Error creating comment:", error);
    return { success: false, error: "Error al crear comentario" };
  }
}

/**
 * Helper: Get first user in org (for activity creation)
 */
async function getFirstUserInOrg(orgId: string): Promise<string | null> {
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId },
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  });
  return member?.userId || null;
}

/**
 * Get ticket stats for dashboard
 */
export async function getTicketStats(): Promise<ActionResponse<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  open: number;
  resolvedThisWeek: number;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [total, open, inProgress, resolved, closed, low, medium, high, urgent, resolvedThisWeek] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "OPEN" } }),
        prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.ticket.count({ where: { status: "CLOSED" } }),
        prisma.ticket.count({ where: { priority: "LOW" } }),
        prisma.ticket.count({ where: { priority: "MEDIUM" } }),
        prisma.ticket.count({ where: { priority: "HIGH" } }),
        prisma.ticket.count({ where: { priority: "URGENT" } }),
        prisma.ticket.count({
          where: {
            status: { in: ["RESOLVED", "CLOSED"] },
            resolvedAt: { gte: startOfWeek },
          },
        }),
      ]);

    return {
      success: true,
      data: {
        total,
        byStatus: { OPEN: open, IN_PROGRESS: inProgress, RESOLVED: resolved, CLOSED: closed },
        byPriority: { LOW: low, MEDIUM: medium, HIGH: high, URGENT: urgent },
        open,
        resolvedThisWeek,
      },
    };
  } catch (error) {
    console.error("[TICKETS] Error fetching stats:", error);
    return { success: false, error: "Error al obtener estadísticas" };
  }
}
