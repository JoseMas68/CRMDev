import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

// Use Node.js runtime for Prisma support
export const runtime = 'nodejs';

// Helper para obtener organizationId y userId desde API key
async function getOrgIdFromToken(token: string): Promise<{ organizationId: string; userId: string } | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: token },
    select: { organizationId: true, userId: true },
  });
  return apiKey ? { organizationId: apiKey.organizationId, userId: apiKey.userId } : null;
}

// Schema para validar requests
const restRequestSchema = z.object({
  tool: z.enum([
    // Projects (4)
    'list_projects', 'create_project', 'update_project', 'delete_project',
    // Tasks (4)
    'list_tasks', 'create_task', 'update_task', 'delete_task',
    // Clients (4)
    'list_clients', 'create_client', 'update_client', 'delete_client',
    // Members (1)
    'list_members',
    // Tickets (4)
    'list_tickets', 'create_ticket', 'update_ticket', 'delete_ticket',
    // Time (1)
    'get_project_time_report'
  ]),
  arguments: z.record(z.any()).optional(),
});

// Tool definitions for discovery
const toolDefinitions = {
  list_projects: {
    description: "Listar todos los proyectos de la organización activa del usuario",
    parameters: {
      limit: { type: "number", description: "Límite de proyectos a devolver, por defecto 10", optional: true },
      status: { type: "string", description: "Filtrar por estado: NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED", optional: true },
    },
  },
  create_project: {
    description: "Crear un nuevo proyecto en la organización",
    parameters: {
      name: { type: "string", description: "Nombre del proyecto", required: true },
      description: { type: "string", description: "Descripción del proyecto", optional: true },
      type: { type: "string", description: "Tipo: GITHUB, WORDPRESS, VERCEL, OTHER", optional: true },
      status: { type: "string", description: "Estado: NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED", optional: true },
      clientId: { type: "string", description: "ID del cliente asociado", optional: true },
    },
  },
  update_project: {
    description: "Actualizar un proyecto existente",
    parameters: {
      projectId: { type: "string", description: "ID del proyecto", required: true },
      name: { type: "string", description: "Nuevo nombre", optional: true },
      description: { type: "string", description: "Nueva descripción", optional: true },
      status: { type: "string", description: "Nuevo estado", optional: true },
      progress: { type: "number", description: "Progreso (0-100)", optional: true },
    },
  },
  delete_project: {
    description: "Eliminar un proyecto (irreversible)",
    parameters: {
      projectId: { type: "string", description: "ID del proyecto", required: true },
    },
  },
  list_tasks: {
    description: "Listar tareas con filtros",
    parameters: {
      limit: { type: "number", description: "Límite de tareas a devolver, por defecto 20", optional: true },
      projectId: { type: "string", description: "Filtrar por proyecto", optional: true },
      status: { type: "string", description: "Estado: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED", optional: true },
    },
  },
  create_task: {
    description: "Crear una nueva tarea con asignación y fecha límite",
    parameters: {
      title: { type: "string", description: "Título de la tarea", required: true },
      description: { type: "string", description: "Descripción detallada", optional: true },
      projectId: { type: "string", description: "ID del proyecto", optional: true },
      assigneeId: { type: "string", description: "ID del usuario asignado (usar list_members para obtener IDs)", optional: true },
      status: { type: "string", description: "Estado inicial: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED", optional: true },
      priority: { type: "string", description: "Prioridad: LOW, MEDIUM, HIGH, URGENT", optional: true },
      dueDate: { type: "string", description: "Fecha límite ISO 8601 (ej: 2026-03-15)", optional: true },
    },
  },
  update_task: {
    description: "Actualizar una tarea",
    parameters: {
      taskId: { type: "string", description: "ID de la tarea", required: true },
      title: { type: "string", description: "Nuevo título", optional: true },
      description: { type: "string", description: "Nueva descripción", optional: true },
      status: { type: "string", description: "Nuevo estado", optional: true },
      priority: { type: "string", description: "Nueva prioridad", optional: true },
    },
  },
  delete_task: {
    description: "Eliminar una tarea (irreversible)",
    parameters: {
      taskId: { type: "string", description: "ID de la tarea", required: true },
    },
  },
  list_clients: {
    description: "Listar clientes con filtros",
    parameters: {
      limit: { type: "number", description: "Límite de clientes a devolver, por defecto 20", optional: true },
      status: { type: "string", description: "Estado: LEAD, PROSPECT, CUSTOMER, INACTIVE, CHURNED", optional: true },
    },
  },
  create_client: {
    description: "Crear un nuevo cliente",
    parameters: {
      name: { type: "string", description: "Nombre del cliente", required: true },
      email: { type: "string", description: "Email del cliente", optional: true },
      company: { type: "string", description: "Empresa", optional: true },
      phone: { type: "string", description: "Teléfono", optional: true },
      status: { type: "string", description: "Estado: LEAD, PROSPECT, CUSTOMER, INACTIVE, CHURNED", optional: true },
      source: { type: "string", description: "Fuente del lead", optional: true },
      notes: { type: "string", description: "Notas", optional: true },
    },
  },
  update_client: {
    description: "Actualizar un cliente",
    parameters: {
      clientId: { type: "string", description: "ID del cliente", required: true },
      name: { type: "string", description: "Nuevo nombre", optional: true },
      email: { type: "string", description: "Nuevo email", optional: true },
      company: { type: "string", description: "Nueva empresa", optional: true },
      status: { type: "string", description: "Nuevo estado", optional: true },
      notes: { type: "string", description: "Nuevas notas", optional: true },
    },
  },
  delete_client: {
    description: "Eliminar un cliente (irreversible)",
    parameters: {
      clientId: { type: "string", description: "ID del cliente", required: true },
    },
  },
  list_members: {
    description: "Listar miembros de la organización para asignar tareas",
    parameters: {
      limit: { type: "number", description: "Límite de miembros a devolver, por defecto 50", optional: true },
    },
  },
  list_tickets: {
    description: "Listar tickets de soporte",
    parameters: {
      limit: { type: "number", description: "Límite de tickets a devolver, por defecto 20", optional: true },
      status: { type: "string", description: "Estado: OPEN, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CLOSED", optional: true },
      priority: { type: "string", description: "Prioridad: LOW, MEDIUM, HIGH, URGENT", optional: true },
      category: { type: "string", description: "Categoría: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING", optional: true },
      clientId: { type: "string", description: "Filtrar por cliente", optional: true },
    },
  },
  create_ticket: {
    description: "Crear un nuevo ticket de soporte",
    parameters: {
      title: { type: "string", description: "Título del ticket", required: true },
      description: { type: "string", description: "Descripción detallada del problema", required: true },
      guestName: { type: "string", description: "Nombre del cliente/invitado", required: true },
      guestEmail: { type: "string", description: "Email del cliente/invitado", required: true },
      category: { type: "string", description: "Categoría: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING", optional: true },
      priority: { type: "string", description: "Prioridad: LOW, MEDIUM, HIGH, URGENT", optional: true },
      clientId: { type: "string", description: "ID del cliente", optional: true },
      projectId: { type: "string", description: "ID del proyecto relacionado", optional: true },
    },
  },
  update_ticket: {
    description: "Actualizar un ticket",
    parameters: {
      ticketId: { type: "string", description: "ID del ticket", required: true },
      status: { type: "string", description: "Nuevo estado: OPEN, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CLOSED", optional: true },
      priority: { type: "string", description: "Nueva prioridad: LOW, MEDIUM, HIGH, URGENT", optional: true },
      category: { type: "string", description: "Nueva categoría: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING", optional: true },
    },
  },
  delete_ticket: {
    description: "Eliminar un ticket (irreversible)",
    parameters: {
      ticketId: { type: "string", description: "ID del ticket", required: true },
    },
  },
  get_project_time_report: {
    description: "Obtener reporte de tiempo de un proyecto",
    parameters: {
      projectId: { type: "string", description: "ID del proyecto", required: true },
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    // Auth check - optional for discovery, but still validate if key provided
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const authData = await getOrgIdFromToken(token);
      if (!authData) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
      }
    }

    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return NextResponse.json(
      {
        success: true,
        tools: toolDefinitions,
        count: Object.keys(toolDefinitions).length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const authData = await getOrgIdFromToken(token);

    if (!authData) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    const { organizationId, userId } = authData;

    // Rate limiting
    const rateLimitKey = getRateLimitKey("mcp:rest", userId, organizationId);
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.mcpRest.limit,
      RATE_LIMITS.mcpRest.window
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: 10 },
        { status: 429 }
      );
    }

    // Update last used
    await prisma.apiKey.updateMany({
      where: { key: token },
      data: { lastUsedAt: new Date() },
    });

    // Parse request
    const body = await req.json();
    const { tool, arguments: args = {} } = restRequestSchema.parse(body);

    // Execute tool
    let result;

    switch (tool) {
      // PROJECTS
      case 'list_projects':
        result = await prisma.project.findMany({
          where: {
            organizationId,
            ...(args.status && { status: args.status }),
          },
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            type: true,
            deadline: true,
          },
          take: args.limit || 10,
          orderBy: { updatedAt: "desc" },
        });
        break;

      case 'create_project':
        if (args.clientId) {
          const client = await prisma.client.findFirst({
            where: { id: args.clientId, organizationId },
            select: { id: true },
          });
          if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 400 });
          }
        }
        result = await prisma.project.create({
          data: {
            name: args.name,
            description: args.description,
            type: args.type || "OTHER",
            status: args.status || "NOT_STARTED",
            clientId: args.clientId,
            organizationId,
          },
          select: { id: true, name: true, status: true },
        });
        break;

      case 'update_project':
        const existingProject = await prisma.project.findFirst({
          where: { id: args.projectId, organizationId },
          select: { id: true },
        });
        if (!existingProject) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        result = await prisma.project.update({
          where: { id: args.projectId },
          data: {
            ...(args.name && { name: args.name }),
            ...(args.description !== undefined && { description: args.description }),
            ...(args.status && { status: args.status }),
            ...(args.progress !== undefined && { progress: args.progress }),
          },
          select: { id: true, name: true, status: true, progress: true },
        });
        break;

      case 'delete_project':
        const toDeleteProject = await prisma.project.findFirst({
          where: { id: args.projectId, organizationId },
          select: { id: true, name: true },
        });
        if (!toDeleteProject) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        await prisma.project.delete({ where: { id: args.projectId } });
        result = { success: true, message: `Project "${toDeleteProject.name}" deleted` };
        break;

      // TASKS
      case 'list_tasks':
        result = await prisma.task.findMany({
          where: {
            organizationId,
            ...(args.projectId && { projectId: args.projectId }),
            ...(args.status && { status: args.status }),
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            project: { select: { name: true } },
          },
          take: args.limit || 20,
          orderBy: { createdAt: "desc" },
        });
        break;

      case 'create_task':
        if (args.projectId) {
          const project = await prisma.project.findFirst({
            where: { id: args.projectId, organizationId },
            select: { id: true },
          });
          if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 400 });
          }
        }
        // Verify assignee belongs to org if provided
        if (args.assigneeId) {
          const member = await prisma.member.findFirst({
            where: { userId: args.assigneeId, organizationId },
            select: { id: true },
          });
          if (!member) {
            return NextResponse.json({ error: "Assignee is not a member of your organization" }, { status: 400 });
          }
        }
        result = await prisma.task.create({
          data: {
            title: args.title,
            description: args.description,
            projectId: args.projectId,
            assigneeId: args.assigneeId,
            status: args.status || "TODO",
            priority: args.priority || "MEDIUM",
            dueDate: args.dueDate ? new Date(args.dueDate) : null,
            organizationId,
            creatorId: userId,
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { name: true } },
          },
        });
        break;

      case 'update_task':
        const existingTask = await prisma.task.findFirst({
          where: { id: args.taskId, organizationId },
          select: { id: true },
        });
        if (!existingTask) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        result = await prisma.task.update({
          where: { id: args.taskId },
          data: {
            ...(args.title && { title: args.title }),
            ...(args.description !== undefined && { description: args.description }),
            ...(args.status && { status: args.status }),
            ...(args.priority && { priority: args.priority }),
          },
          select: { id: true, title: true, status: true, priority: true },
        });
        break;

      case 'delete_task':
        const toDeleteTask = await prisma.task.findFirst({
          where: { id: args.taskId, organizationId },
          select: { id: true, title: true },
        });
        if (!toDeleteTask) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        await prisma.task.delete({ where: { id: args.taskId } });
        result = { success: true, message: `Task "${toDeleteTask.title}" deleted` };
        break;

      // CLIENTS
      case 'list_clients':
        result = await prisma.client.findMany({
          where: {
            organizationId,
            ...(args.status && { status: args.status }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            status: true,
          },
          take: args.limit || 20,
          orderBy: { createdAt: "desc" },
        });
        break;

      case 'create_client':
        result = await prisma.client.create({
          data: {
            name: args.name,
            email: args.email,
            company: args.company,
            phone: args.phone,
            status: args.status || "LEAD",
            source: args.source,
            notes: args.notes,
            organizationId,
          },
          select: { id: true, name: true, email: true, status: true },
        });
        break;

      case 'update_client':
        const existingClient = await prisma.client.findFirst({
          where: { id: args.clientId, organizationId },
          select: { id: true },
        });
        if (!existingClient) {
          return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }
        result = await prisma.client.update({
          where: { id: args.clientId },
          data: {
            ...(args.name && { name: args.name }),
            ...(args.email && { email: args.email }),
            ...(args.company !== undefined && { company: args.company }),
            ...(args.status && { status: args.status }),
            ...(args.notes !== undefined && { notes: args.notes }),
          },
          select: { id: true, name: true, email: true, status: true },
        });
        break;

      case 'delete_client':
        const toDeleteClient = await prisma.client.findFirst({
          where: { id: args.clientId, organizationId },
          select: { id: true, name: true },
        });
        if (!toDeleteClient) {
          return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }
        await prisma.client.delete({ where: { id: args.clientId } });
        result = { success: true, message: `Client "${toDeleteClient.name}" deleted` };
        break;

      // TIME REPORT
      case 'get_project_time_report':
        const project = await prisma.project.findFirst({
          where: { id: args.projectId, organizationId },
          select: { name: true },
        });
        if (!project) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        const entries = await prisma.timeEntry.findMany({
          where: { task: { projectId: args.projectId } },
          include: {
            user: { select: { name: true } },
            task: { select: { title: true } },
          },
        });
        const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration, 0);
        const totalHours = Math.floor(totalMinutes / 60);
        result = {
          projectName: project.name,
          totalHours: `${totalHours}h ${totalMinutes % 60}m`,
          totalEntries: entries.length,
          entries: entries.map(e => ({
            task: e.task.title,
            user: e.user.name,
            minutes: e.duration,
          })),
        };
        break;

      // MEMBERS
      case 'list_members':
        const members = await prisma.member.findMany({
          where: { organizationId },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            },
            role: true,
          },
          take: args.limit || 50,
          orderBy: { createdAt: "asc" },
        });
        result = members;
        break;

      // TICKETS
      case 'list_tickets':
        result = await prisma.ticket.findMany({
          where: {
            organizationId,
            ...(args.status && { status: args.status }),
            ...(args.priority && { priority: args.priority }),
            ...(args.category && { category: args.category }),
            ...(args.clientId && { clientId: args.clientId }),
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            category: true,
            guestName: true,
            guestEmail: true,
            createdAt: true,
            updatedAt: true,
            client: { select: { name: true } },
            project: { select: { name: true } },
          },
          take: args.limit || 20,
          orderBy: { createdAt: "desc" },
        });
        break;

      case 'create_ticket':
        // Verify client if provided
        if (args.clientId) {
          const ticketClient = await prisma.client.findFirst({
            where: { id: args.clientId, organizationId },
            select: { id: true },
          });
          if (!ticketClient) {
            return NextResponse.json({ error: "Client not found" }, { status: 400 });
          }
        }
        result = await prisma.ticket.create({
          data: {
            title: args.title,
            description: args.description,
            guestName: args.guestName,
            guestEmail: args.guestEmail,
            category: args.category || "SUPPORT",
            priority: args.priority || "MEDIUM",
            status: "OPEN",
            clientId: args.clientId,
            projectId: args.projectId,
            organizationId,
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: true,
          },
        });
        break;

      case 'update_ticket':
        const existingTicket = await prisma.ticket.findFirst({
          where: { id: args.ticketId, organizationId },
          select: { id: true },
        });
        if (!existingTicket) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }
        result = await prisma.ticket.update({
          where: { id: args.ticketId },
          data: {
            ...(args.status && { status: args.status }),
            ...(args.priority && { priority: args.priority }),
            ...(args.category && { category: args.category }),
          },
          select: { id: true, title: true, status: true, priority: true, category: true },
        });
        break;

      case 'delete_ticket':
        const toDeleteTicket = await prisma.ticket.findFirst({
          where: { id: args.ticketId, organizationId },
          select: { id: true, title: true },
        });
        if (!toDeleteTicket) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }
        await prisma.ticket.delete({ where: { id: args.ticketId } });
        result = { success: true, message: `Ticket "${toDeleteTicket.title}" deleted` };
        break;

      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    // Add CORS headers to response
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return NextResponse.json(
      { success: true, data: result },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[MCP_REST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return handleOptionsRequest(origin);
}
