"use server";

/**
 * Project Server Actions
 *
 * Security Notes:
 * - All actions validate session before executing
 * - All actions validate activeOrganizationId
 * - Input validated with Zod schemas
 * - Prisma middleware ensures tenant isolation
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getPrismaWithSession, prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
  projectFilterSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectFilter,
} from "@/lib/validations/project";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper: Get current user's organization role
 */
async function getOrgRole(userId: string, organizationId: string): Promise<string | null> {
  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { role: true },
  });
  return member?.role ?? null;
}

/**
 * Get all projects for the current organization
 */
export async function getProjects(
  filter?: Partial<ProjectFilter>
): Promise<ActionResponse<{
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
    healthStatus: string | null;
    progress: number;
    startDate: Date | null;
    deadline: Date | null;
    budget: number | null;
    spent: number;
    currency: string;
    repoUrl: string | null;
    wpUrl: string | null;
    vercelUrl: string | null;
    techStack: string[];
    client: { id: string; name: string } | null;
    projectMembers: Array<{
      user: { id: string; name: string; image: string | null };
    }>;
    _count: { tasks: number };
    createdAt: Date;
  }>;
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

    const validatedFilter = projectFilterSchema.partial().parse(filter || {});
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      type,
      status,
      clientId,
      search,
    } = validatedFilter;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Access control: members only see projects they're assigned to
    const orgRole = await getOrgRole(session.user.id, session.session.activeOrganizationId);
    if (orgRole !== "owner" && orgRole !== "admin") {
      where.projectMembers = {
        some: { userId: session.user.id },
      };
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          status: true,
          healthStatus: true,
          progress: true,
          startDate: true,
          deadline: true,
          budget: true,
          spent: true,
          currency: true,
          repoUrl: true,
          wpUrl: true,
          vercelUrl: true,
          techStack: true,
          createdAt: true,
          client: {
            select: { id: true, name: true },
          },
          projectMembers: {
            take: 5,
            select: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      db.project.count({ where }),
    ]);

    return {
      success: true,
      data: {
        projects: projects.map((p) => ({
          ...p,
          budget: p.budget ? Number(p.budget) : null,
          spent: Number(p.spent),
        })),
        total,
      },
    };
  } catch (error) {
    console.error("[PROJECTS] Error fetching projects:", error);
    return { success: false, error: "Error al obtener proyectos" };
  }
}

/**
 * Get a single project by ID with tasks
 */
export async function getProject(id: string): Promise<ActionResponse<{
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  progress: number;
  startDate: Date | null;
  deadline: Date | null;
  completedAt: Date | null;
  budget: number | null;
  spent: number;
  currency: string;
  repoUrl: string | null;
  wpUrl: string | null;
  vercelUrl: string | null;
  techStack: string[];
  client: { id: string; name: string; email: string | null } | null;
  projectMembers: Array<{
    id: string;
    role: string;
    createdAt: Date;
    user: { id: string; name: string; email: string; image: string | null };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    assignee: { id: string; name: string; image: string | null } | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: Date;
    user: { name: string; image: string | null };
  }>;
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const project = await db.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        progress: true,
        startDate: true,
        deadline: true,
        completedAt: true,
        budget: true,
        spent: true,
        currency: true,
        repoUrl: true,
        wpUrl: true,
        vercelUrl: true,
        techStack: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { id: true, name: true, email: true },
        },
        projectMembers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { order: "asc" }],
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            title: true,
            createdAt: true,
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    // Access control: members only see projects they're assigned to
    const orgRole = await getOrgRole(session.user.id, session.session.activeOrganizationId);
    if (orgRole !== "owner" && orgRole !== "admin") {
      const hasAccess = project.projectMembers.some(
        (pm) => pm.user.id === session.user.id
      );
      if (!hasAccess) {
        return { success: false, error: "No tienes acceso a este proyecto" };
      }
    }

    return {
      success: true,
      data: {
        ...project,
        budget: project.budget ? Number(project.budget) : null,
        spent: Number(project.spent),
      },
    };
  } catch (error) {
    console.error("[PROJECTS] Error fetching project:", error);
    return { success: false, error: "Error al obtener proyecto" };
  }
}

/**
 * Create a new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = createProjectSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const project = await db.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        type: validatedData.type,
        status: validatedData.status,
        startDate: validatedData.startDate,
        deadline: validatedData.deadline,
        budget: validatedData.budget,
        currency: validatedData.currency,
        clientId: validatedData.clientId || null,
        repoUrl: validatedData.repoUrl || null,
        wpUrl: validatedData.wpUrl || null,
        vercelUrl: validatedData.vercelUrl || null,
        techStack: validatedData.techStack,
        labels: validatedData.labels,
        organizationId: session.session.activeOrganizationId,
      },
      select: { id: true },
    });

    // Auto-assign creator as project lead
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: "lead",
      },
    });

    // Create activity
    await db.activity.create({
      data: {
        type: "PROJECT_CREATED",
        title: `Proyecto "${validatedData.name}" creado`,
        projectId: project.id,
        clientId: validatedData.clientId || null,
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true, data: { id: project.id } };
  } catch (error) {
    console.error("[PROJECTS] Error creating project:", error);
    return { success: false, error: "Error al crear proyecto" };
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = updateProjectSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const existingProject = await db.project.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingProject) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    // Check if status changed to COMPLETED
    const isCompleting =
      validatedData.status === "COMPLETED" &&
      existingProject.status !== "COMPLETED";

    await db.project.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description || null,
        }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.progress !== undefined && {
          progress: validatedData.progress,
        }),
        ...(validatedData.startDate !== undefined && {
          startDate: validatedData.startDate,
        }),
        ...(validatedData.deadline !== undefined && {
          deadline: validatedData.deadline,
        }),
        ...(validatedData.budget !== undefined && {
          budget: validatedData.budget,
        }),
        ...(validatedData.spent !== undefined && { spent: validatedData.spent }),
        ...(validatedData.currency && { currency: validatedData.currency }),
        ...(validatedData.clientId !== undefined && {
          clientId: validatedData.clientId,
        }),
        ...(validatedData.repoUrl !== undefined && {
          repoUrl: validatedData.repoUrl || null,
        }),
        ...(validatedData.wpUrl !== undefined && {
          wpUrl: validatedData.wpUrl || null,
        }),
        ...(validatedData.vercelUrl !== undefined && {
          vercelUrl: validatedData.vercelUrl || null,
        }),
        ...(validatedData.techStack && { techStack: validatedData.techStack }),
        ...(validatedData.labels && { labels: validatedData.labels }),
        ...(isCompleting && { completedAt: new Date() }),
      },
    });

    // Log completion activity
    if (isCompleting) {
      await db.activity.create({
        data: {
          type: "PROJECT_COMPLETED",
          title: `Proyecto completado`,
          projectId: id,
          userId: session.user.id,
          organizationId: session.session.activeOrganizationId,
        },
      });
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[PROJECTS] Error updating project:", error);
    return { success: false, error: "Error al actualizar proyecto" };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const project = await db.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    await db.project.delete({ where: { id } });

    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[PROJECTS] Error deleting project:", error);
    return { success: false, error: "Error al eliminar proyecto" };
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats(): Promise<ActionResponse<{
  total: number;
  byStatus: Record<string, number>;
  overdue: number;
  completedThisMonth: number;
}>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, notStarted, inProgress, onHold, completed, cancelled, overdue, completedThisMonth] =
      await Promise.all([
        db.project.count(),
        db.project.count({ where: { status: "NOT_STARTED" } }),
        db.project.count({ where: { status: "IN_PROGRESS" } }),
        db.project.count({ where: { status: "ON_HOLD" } }),
        db.project.count({ where: { status: "COMPLETED" } }),
        db.project.count({ where: { status: "CANCELLED" } }),
        db.project.count({
          where: {
            deadline: { lt: now },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        }),
        db.project.count({
          where: {
            status: "COMPLETED",
            completedAt: { gte: startOfMonth },
          },
        }),
      ]);

    return {
      success: true,
      data: {
        total,
        byStatus: {
          NOT_STARTED: notStarted,
          IN_PROGRESS: inProgress,
          ON_HOLD: onHold,
          COMPLETED: completed,
          CANCELLED: cancelled,
        },
        overdue,
        completedThisMonth,
      },
    };
  } catch (error) {
    console.error("[PROJECTS] Error fetching stats:", error);
    return { success: false, error: "Error al obtener estadisticas" };
  }
}

/**
 * Update project progress based on completed tasks
 */
export async function recalculateProjectProgress(
  projectId: string
): Promise<ActionResponse<{ progress: number }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "DONE" },
          select: { id: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    const totalTasks = project._count.tasks;
    const completedTasks = project.tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await db.project.update({
      where: { id: projectId },
      data: { progress },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: { progress } };
  } catch (error) {
    console.error("[PROJECTS] Error recalculating progress:", error);
    return { success: false, error: "Error al recalcular progreso" };
  }
}
