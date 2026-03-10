import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Store active transports globally for POST messages handler
const globalForSse = globalThis as unknown as {
    mcpTransports: Map<string, { transport: any; organizationId: string }>;
};
export const activeTransports = globalForSse.mcpTransports || new Map<string, { transport: any; organizationId: string }>();
if (process.env.NODE_ENV !== "production") globalForSse.mcpTransports = activeTransports;

// Global singleton instance para evitar fugas de memoria en NextJS HMR (Hot Module Replacement)
const globalForMcp = globalThis as unknown as {
    mcpServer: McpServer | undefined;
};

// Helper para obtener organizationId con validación
function getOrgId(extra: any): string {
    const orgId = extra?._meta?.organizationId as string;
    if (!orgId) throw new Error("Acceso denegado: falta organizationId");
    return orgId;
}

// Crear la instancia del servidor
const createMcpServer = () => {
    const server = new McpServer({
        name: "CRMDev-MCP",
        version: "1.0.0",
    });

    // ============================================
    // PROJECTS
    // ============================================

    server.tool(
        "list_projects",
        "Listar todos los proyectos de la organización activa del usuario",
        {
            limit: z.number().optional().describe("Límite de proyectos a devolver, por defecto 10"),
            status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional().describe("Filtrar por estado"),
        },
        async ({ limit, status }, extra) => {
            const orgId = getOrgId(extra);

            const projects = await prisma.project.findMany({
                where: { organizationId: orgId, status: status as any },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    progress: true,
                    deadline: true,
                    type: true,
                },
                take: limit || 10,
                orderBy: { updatedAt: "desc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
            };
        }
    );

    server.tool(
        "create_project",
        "Crear un nuevo proyecto en la organización",
        {
            name: z.string().describe("Nombre del proyecto"),
            description: z.string().optional().describe("Descripción del proyecto"),
            type: z.enum(["GITHUB", "WORDPRESS", "VERCEL", "OTHER"]).optional().describe("Tipo de proyecto"),
            status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional().describe("Estado inicial"),
            clientId: z.string().optional().describe("ID del cliente asociado (opcional)"),
        },
        async ({ name, description, type, status, clientId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify client belongs to org if provided
            if (clientId) {
                const client = await prisma.client.findFirst({
                    where: { id: clientId, organizationId: orgId },
                    select: { id: true },
                });
                if (!client) {
                    return {
                        content: [{ type: "text", text: "Error: Cliente no encontrado en tu organización." }],
                    };
                }
            }

            const project = await prisma.project.create({
                data: {
                    name,
                    description,
                    type: type || "OTHER",
                    status: status || "NOT_STARTED",
                    clientId,
                    organizationId: orgId,
                },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    type: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, project }, null, 2) }],
            };
        }
    );

    server.tool(
        "update_project",
        "Actualizar un proyecto existente",
        {
            projectId: z.string().describe("ID del proyecto a actualizar"),
            name: z.string().optional().describe("Nuevo nombre del proyecto"),
            description: z.string().optional().describe("Nueva descripción"),
            status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional().describe("Nuevo estado"),
            progress: z.number().min(0).max(100).optional().describe("Progreso del proyecto (0-100)"),
        },
        async ({ projectId, name, description, status, progress }, extra) => {
            const orgId = getOrgId(extra);

            // Verify project belongs to org
            const existing = await prisma.project.findFirst({
                where: { id: projectId, organizationId: orgId },
                select: { id: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Proyecto no encontrado en tu organización." }],
                };
            }

            const project = await prisma.project.update({
                where: { id: projectId },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(status && { status }),
                    ...(progress !== undefined && { progress }),
                },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    progress: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, project }, null, 2) }],
            };
        }
    );

    server.tool(
        "delete_project",
        "Eliminar un proyecto (CUIDADO: esta acción no se puede deshacer)",
        {
            projectId: z.string().describe("ID del proyecto a eliminar"),
        },
        async ({ projectId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify project belongs to org
            const existing = await prisma.project.findFirst({
                where: { id: projectId, organizationId: orgId },
                select: { id: true, name: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Proyecto no encontrado en tu organización." }],
                };
            }

            await prisma.project.delete({
                where: { id: projectId },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, message: `Proyecto "${existing.name}" eliminado correctamente.` }, null, 2) }],
            };
        }
    );

    // ============================================
    // TASKS
    // ============================================

    server.tool(
        "list_tasks",
        "Listar tareas de la organización",
        {
            limit: z.number().optional().describe("Límite de tareas a devolver, por defecto 20"),
            projectId: z.string().optional().describe("Filtrar por proyecto"),
            status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional().describe("Filtrar por estado"),
        },
        async ({ limit, projectId, status }, extra) => {
            const orgId = getOrgId(extra);

            const tasks = await prisma.task.findMany({
                where: {
                    organizationId: orgId,
                    ...(projectId && { projectId }),
                    ...(status && { status: status as any }),
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    projectId: true,
                    project: { select: { name: true } },
                    assignee: { select: { name: true } },
                },
                take: limit || 20,
                orderBy: { createdAt: "desc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
            };
        }
    );

    server.tool(
        "create_task",
        "Crear una nueva tarea",
        {
            title: z.string().describe("Título de la tarea"),
            description: z.string().optional().describe("Descripción de la tarea"),
            projectId: z.string().optional().describe("ID del proyecto (opcional)"),
            assigneeId: z.string().optional().describe("ID del usuario asignado (opcional, usar list_members para obtener IDs)"),
            status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional().describe("Estado inicial"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Prioridad"),
            dueDate: z.string().optional().describe("Fecha límite (ISO 8601)"),
        },
        async ({ title, description, projectId, assigneeId, status, priority, dueDate }, extra) => {
            const orgId = getOrgId(extra);

            // Verify project belongs to org if provided
            if (projectId) {
                const project = await prisma.project.findFirst({
                    where: { id: projectId, organizationId: orgId },
                    select: { id: true },
                });
                if (!project) {
                    return {
                        content: [{ type: "text", text: "Error: Proyecto no encontrado en tu organización." }],
                    };
                }
            }

            // Verify assignee belongs to org if provided
            if (assigneeId) {
                const member = await prisma.member.findFirst({
                    where: { userId: assigneeId, organizationId: orgId },
                    select: { id: true },
                });
                if (!member) {
                    return {
                        content: [{ type: "text", text: "Error: El usuario asignado no es miembro de tu organización." }],
                    };
                }
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    projectId,
                    assigneeId,
                    status: status || "TODO",
                    priority: priority || "MEDIUM",
                    dueDate: dueDate ? new Date(dueDate) : null,
                    organizationId: orgId,
                    creatorId: "system", // MCP creates tasks as system user
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    assignee: { select: { name: true } },
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, task }, null, 2) }],
            };
        }
    );

    server.tool(
        "update_task",
        "Actualizar una tarea existente",
        {
            taskId: z.string().describe("ID de la tarea a actualizar"),
            title: z.string().optional().describe("Nuevo título"),
            description: z.string().optional().describe("Nueva descripción"),
            status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional().describe("Nuevo estado"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Nueva prioridad"),
        },
        async ({ taskId, title, description, status, priority }, extra) => {
            const orgId = getOrgId(extra);

            // Verify task belongs to org
            const existing = await prisma.task.findFirst({
                where: { id: taskId, organizationId: orgId },
                select: { id: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Tarea no encontrada en tu organización." }],
                };
            }

            const task = await prisma.task.update({
                where: { id: taskId },
                data: {
                    ...(title && { title }),
                    ...(description !== undefined && { description }),
                    ...(status && { status }),
                    ...(priority && { priority }),
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, task }, null, 2) }],
            };
        }
    );

    server.tool(
        "delete_task",
        "Eliminar una tarea (CUIDADO: no se puede deshacer)",
        {
            taskId: z.string().describe("ID de la tarea a eliminar"),
        },
        async ({ taskId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify task belongs to org
            const existing = await prisma.task.findFirst({
                where: { id: taskId, organizationId: orgId },
                select: { id: true, title: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Tarea no encontrada en tu organización." }],
                };
            }

            await prisma.task.delete({
                where: { id: taskId },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, message: `Tarea "${existing.title}" eliminada.` }, null, 2) }],
            };
        }
    );

    // ============================================
    // CLIENTS
    // ============================================

    server.tool(
        "list_clients",
        "Listar clientes de la organización",
        {
            limit: z.number().optional().describe("Límite de clientes a devolver, por defecto 20"),
            status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE", "CHURNED"]).optional().describe("Filtrar por estado"),
        },
        async ({ limit, status }, extra) => {
            const orgId = getOrgId(extra);

            const clients = await prisma.client.findMany({
                where: { organizationId: orgId, status: status as any },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    company: true,
                    status: true,
                    phone: true,
                },
                take: limit || 20,
                orderBy: { createdAt: "desc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(clients, null, 2) }],
            };
        }
    );

    server.tool(
        "create_client",
        "Crear un nuevo cliente o lead",
        {
            name: z.string().describe("Nombre del cliente"),
            email: z.string().email().optional().describe("Email del cliente"),
            company: z.string().optional().describe("Empresa del cliente"),
            phone: z.string().optional().describe("Teléfono del cliente"),
            status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE", "CHURNED"]).optional().describe("Estado inicial"),
            source: z.string().optional().describe("Fuente del lead (web, referral, etc)"),
            notes: z.string().optional().describe("Notas adicionales"),
        },
        async ({ name, email, company, phone, status, source, notes }, extra) => {
            const orgId = getOrgId(extra);

            const client = await prisma.client.create({
                data: {
                    name,
                    email,
                    company,
                    phone,
                    status: status || "LEAD",
                    source,
                    notes,
                    organizationId: orgId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    company: true,
                    status: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, client }, null, 2) }],
            };
        }
    );

    server.tool(
        "update_client",
        "Actualizar un cliente existente",
        {
            clientId: z.string().describe("ID del cliente a actualizar"),
            name: z.string().optional().describe("Nuevo nombre"),
            email: z.string().email().optional().describe("Nuevo email"),
            company: z.string().optional().describe("Nueva empresa"),
            status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE", "CHURNED"]).optional().describe("Nuevo estado"),
            notes: z.string().optional().describe("Nuevas notas"),
        },
        async ({ clientId, name, email, company, status, notes }, extra) => {
            const orgId = getOrgId(extra);

            // Verify client belongs to org
            const existing = await prisma.client.findFirst({
                where: { id: clientId, organizationId: orgId },
                select: { id: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Cliente no encontrado en tu organización." }],
                };
            }

            const client = await prisma.client.update({
                where: { id: clientId },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                    ...(company !== undefined && { company }),
                    ...(status && { status }),
                    ...(notes !== undefined && { notes }),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, client }, null, 2) }],
            };
        }
    );

    server.tool(
        "delete_client",
        "Eliminar un cliente (CUIDADO: no se puede deshacer)",
        {
            clientId: z.string().describe("ID del cliente a eliminar"),
        },
        async ({ clientId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify client belongs to org
            const existing = await prisma.client.findFirst({
                where: { id: clientId, organizationId: orgId },
                select: { id: true, name: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Cliente no encontrado en tu organización." }],
                };
            }

            await prisma.client.delete({
                where: { id: clientId },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, message: `Cliente "${existing.name}" eliminado.` }, null, 2) }],
            };
        }
    );

    // ============================================
    // TIME TRACKING
    // ============================================

    server.tool(
        "get_project_time_report",
        "Obtener el reporte de tiempos, total de horas y desglose de tareas de un proyecto",
        {
            projectId: z.string().describe("El ID del proyecto"),
        },
        async ({ projectId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify project belongs to org
            const project = await prisma.project.findFirst({
                where: { id: projectId, organizationId: orgId },
                select: { name: true }
            });

            if (!project) {
                return {
                    content: [{ type: "text", text: "Proyecto no encontrado en tu organización." }],
                };
            }

            const entries = await prisma.timeEntry.findMany({
                where: { task: { projectId } },
                include: { user: { select: { name: true } }, task: { select: { title: true } } },
            });

            const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration, 0);
            const totalHours = Math.floor(totalMinutes / 60);

            const summary = {
                projectName: project.name,
                totalHoursDedicadas: `${totalHours} horas y ${totalMinutes % 60} minutos`,
                numeroTotalEntradas: entries.length,
                detalles: entries.map(e => ({
                    tarea: e.task.title,
                    usuario: e.user.name,
                    minutos: e.duration,
                    descripcion: e.description
                }))
            };

            return {
                content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
            };
        }
    );

    // ============================================
    // MEMBERS
    // ============================================

    server.tool(
        "list_members",
        "Listar miembros de la organización para asignar tareas",
        {
            limit: z.number().optional().describe("Límite de miembros a devolver, por defecto 50"),
        },
        async ({ limit }, extra) => {
            const orgId = getOrgId(extra);

            const members = await prisma.member.findMany({
                where: { organizationId: orgId },
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
                take: limit || 50,
                orderBy: { createdAt: "asc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(members, null, 2) }],
            };
        }
    );

    // ============================================
    // TICKETS
    // ============================================

    server.tool(
        "list_tickets",
        "Listar tickets de soporte de la organización",
        {
            limit: z.number().optional().describe("Límite de tickets a devolver, por defecto 20"),
            status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"]).optional().describe("Filtrar por estado"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Filtrar por prioridad"),
            category: z.enum(["BUG", "FEATURE_REQUEST", "QUESTION", "SUPPORT", "BILLING"]).optional().describe("Filtrar por categoría"),
            clientId: z.string().optional().describe("Filtrar por cliente"),
        },
        async ({ limit, status, priority, category, clientId }, extra) => {
            const orgId = getOrgId(extra);

            const tickets = await prisma.ticket.findMany({
                where: {
                    organizationId: orgId,
                    ...(status && { status: status as any }),
                    ...(priority && { priority: priority as any }),
                    ...(category && { category: category as any }),
                    ...(clientId && { clientId }),
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
                    project: { select: { name: true } },
                    client: { select: { name: true, company: true } },
                    createdAt: true,
                    updatedAt: true,
                },
                take: limit || 20,
                orderBy: { createdAt: "desc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(tickets, null, 2) }],
            };
        }
    );

    server.tool(
        "create_ticket",
        "Crear un nuevo ticket de soporte",
        {
            title: z.string().describe("Título del ticket"),
            description: z.string().describe("Descripción detallada del problema"),
            guestName: z.string().describe("Nombre del cliente/invitado"),
            guestEmail: z.string().email().describe("Email del cliente/invitado"),
            category: z.enum(["BUG", "FEATURE_REQUEST", "QUESTION", "SUPPORT", "BILLING"]).optional().describe("Categoría del ticket"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Prioridad del ticket"),
            clientId: z.string().optional().describe("ID del cliente (opcional)"),
            projectId: z.string().optional().describe("ID del proyecto relacionado (opcional)"),
        },
        async ({ title, description, guestName, guestEmail, category, priority, clientId, projectId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify client belongs to org if provided
            if (clientId) {
                const client = await prisma.client.findFirst({
                    where: { id: clientId, organizationId: orgId },
                    select: { id: true },
                });
                if (!client) {
                    return {
                        content: [{ type: "text", text: "Error: Cliente no encontrado en tu organización." }],
                    };
                }
            }

            // Verify project belongs to org if provided
            if (projectId) {
                const project = await prisma.project.findFirst({
                    where: { id: projectId, organizationId: orgId },
                    select: { id: true },
                });
                if (!project) {
                    return {
                        content: [{ type: "text", text: "Error: Proyecto no encontrado en tu organización." }],
                    };
                }
            }

            const ticket = await prisma.ticket.create({
                data: {
                    title,
                    description,
                    guestName,
                    guestEmail,
                    category: category || "SUPPORT",
                    priority: priority || "MEDIUM",
                    status: "OPEN",
                    clientId,
                    projectId,
                    organizationId: orgId,
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    category: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, ticket }, null, 2) }],
            };
        }
    );

    server.tool(
        "update_ticket",
        "Actualizar un ticket de soporte existente",
        {
            ticketId: z.string().describe("ID del ticket a actualizar"),
            status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"]).optional().describe("Nuevo estado"),
            priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Nueva prioridad"),
            category: z.enum(["BUG", "FEATURE_REQUEST", "QUESTION", "SUPPORT", "BILLING"]).optional().describe("Nueva categoría"),
        },
        async ({ ticketId, status, priority, category }, extra) => {
            const orgId = getOrgId(extra);

            // Verify ticket belongs to org
            const existing = await prisma.ticket.findFirst({
                where: { id: ticketId, organizationId: orgId },
                select: { id: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Ticket no encontrado en tu organización." }],
                };
            }

            const ticket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    ...(status && { status }),
                    ...(priority && { priority }),
                    ...(category && { category }),
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    category: true,
                },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, ticket }, null, 2) }],
            };
        }
    );

    server.tool(
        "delete_ticket",
        "Eliminar un ticket de soporte (CUIDADO: no se puede deshacer)",
        {
            ticketId: z.string().describe("ID del ticket a eliminar"),
        },
        async ({ ticketId }, extra) => {
            const orgId = getOrgId(extra);

            // Verify ticket belongs to org
            const existing = await prisma.ticket.findFirst({
                where: { id: ticketId, organizationId: orgId },
                select: { id: true, title: true },
            });

            if (!existing) {
                return {
                    content: [{ type: "text", text: "Error: Ticket no encontrado en tu organización." }],
                };
            }

            await prisma.ticket.delete({
                where: { id: ticketId },
            });

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, message: `Ticket "${existing.title}" eliminado.` }, null, 2) }],
            };
        }
    );

    return server;
};

export const mcpServer = globalForMcp.mcpServer ?? createMcpServer();

if (process.env.NODE_ENV !== "production") {
    globalForMcp.mcpServer = mcpServer;
}
