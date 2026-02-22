import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Store active transports globally for POST messages handler
const globalForSse = globalThis as unknown as {
    mcpTransports: Map<string, SSEServerTransport>;
};
export const activeTransports = globalForSse.mcpTransports || new Map<string, SSEServerTransport>();
if (process.env.NODE_ENV !== "production") globalForSse.mcpTransports = activeTransports;

// Global singleton instance para evitar fugas de memoria en NextJS HMR (Hot Module Replacement)
const globalForMcp = globalThis as unknown as {
    mcpServer: McpServer | undefined;
};

// Crear la instancia del servidor
const createMcpServer = () => {
    const server = new McpServer({
        name: "CRMDev-MCP",
        version: "1.0.0",
    });

    // ============================================
    // Registrar las Herramientas (Tools) de la IA
    // ============================================

    // Tool 1: Listar Proyectos de la Organización
    server.tool(
        "list_projects",
        "Listar todos los proyectos de la organización activa del usuario",
        {
            limit: z.number().optional().describe("Límite de proyectos a devolver, por defecto 10"),
        },
        async ({ limit }, extra) => {
            // Extraemos el organizationId que viene del request autenticado
            const orgId = (extra as any)?._meta?.organizationId as string;
            if (!orgId) throw new Error("Acceso denegado: falta organizationId");

            const projects = await prisma.project.findMany({
                where: { organizationId: orgId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    progress: true,
                    deadline: true,
                },
                take: limit || 10,
                orderBy: { updatedAt: "desc" },
            });

            return {
                content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
            };
        }
    );

    // Tool 2: Reporte Rápido de Tiempos de un Proyecto
    server.tool(
        "get_project_time_report",
        "Obtener el reporte de tiempos, total de horas y desglose de tareas de un proyecto",
        {
            projectId: z.string().describe("El ID del proyecto"),
        },
        async ({ projectId }, extra) => {
            const orgId = (extra as any)?._meta?.organizationId as string;
            if (!orgId) throw new Error("Acceso denegado: falta organizationId");

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

    // En el futuro, más Tools como create_task, update_deal, etc.

    return server;
};

export const mcpServer = globalForMcp.mcpServer ?? createMcpServer();

if (process.env.NODE_ENV !== "production") {
    globalForMcp.mcpServer = mcpServer;
}
