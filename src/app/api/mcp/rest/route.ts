import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Use Node.js runtime for Prisma support
export const runtime = 'nodejs';

// Helper para obtener organizationId desde API key
async function getOrgIdFromToken(token: string): Promise<string | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: token },
    select: { organizationId: true },
  });
  return apiKey?.organizationId || null;
}

// Schema para validar requests
const restRequestSchema = z.object({
  tool: z.enum([
    'list_projects', 'create_project', 'update_project', 'delete_project',
    'list_tasks', 'create_task', 'update_task', 'delete_task',
    'list_clients', 'create_client', 'update_client', 'delete_client',
    'get_project_time_report'
  ]),
  arguments: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const organizationId = await getOrgIdFromToken(token);

    if (!organizationId) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
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
        result = await prisma.task.create({
          data: {
            title: args.title,
            description: args.description,
            projectId: args.projectId,
            status: args.status || "TODO",
            priority: args.priority || "MEDIUM",
            dueDate: args.dueDate ? new Date(args.dueDate) : null,
            organizationId,
            creatorId: "system",
          },
          select: { id: true, title: true, status: true, priority: true },
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

      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[MCP_REST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
