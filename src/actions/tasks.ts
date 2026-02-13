"use server";

/**
 * Task Server Actions
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
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskFilterSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type MoveTaskInput,
  type TaskFilter,
} from "@/lib/validations/task";
import { recalculateProjectProgress } from "./projects";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get all tasks for the current organization
 */
export async function getTasks(
  filter?: Partial<TaskFilter>
): Promise<ActionResponse<{
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    completedAt: Date | null;
    order: number;
    project: { id: string; name: string } | null;
    assignee: { id: string; name: string; image: string | null } | null;
    _count: { subtasks: number };
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

    const validatedFilter = taskFilterSchema.partial().parse(filter || {});
    const {
      page = 1,
      limit = 50,
      sortBy = "order",
      sortOrder = "asc",
      status,
      priority,
      projectId,
      assigneeId,
      search,
      overdue,
      completed,
    } = validatedFilter;

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      parentId: null, // Only get top-level tasks
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ["DONE", "CANCELLED"] };
    }

    if (completed !== undefined) {
      where.status = completed ? "DONE" : { not: "DONE" };
    }

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          order: true,
          createdAt: true,
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { subtasks: true },
          },
        },
      }),
      db.task.count({ where }),
    ]);

    return {
      success: true,
      data: { tasks, total },
    };
  } catch (error) {
    console.error("[TASKS] Error fetching tasks:", error);
    return { success: false, error: "Error al obtener tareas" };
  }
}

/**
 * Get tasks grouped by status for Kanban view
 */
export async function getTasksForKanban(projectId?: string): Promise<
  ActionResponse<{
    columns: Array<{
      id: string;
      title: string;
      tasks: Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        dueDate: Date | null;
        order: number;
        project: { id: string; name: string } | null;
        assignee: { id: string; name: string; image: string | null } | null;
        _count: { subtasks: number };
      }>;
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

    const where: Prisma.TaskWhereInput = {
      parentId: null,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const tasks = await db.task.findMany({
      where,
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        order: true,
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { subtasks: true },
        },
      },
    });

    // Group by status
    const columns = [
      { id: "TODO", title: "Por Hacer", tasks: [] as typeof tasks },
      { id: "IN_PROGRESS", title: "En Progreso", tasks: [] as typeof tasks },
      { id: "IN_REVIEW", title: "En Revision", tasks: [] as typeof tasks },
      { id: "DONE", title: "Completado", tasks: [] as typeof tasks },
    ];

    tasks.forEach((task) => {
      const column = columns.find((c) => c.id === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });

    return {
      success: true,
      data: { columns },
    };
  } catch (error) {
    console.error("[TASKS] Error fetching kanban:", error);
    return { success: false, error: "Error al obtener tareas" };
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<ActionResponse<{
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  order: number;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string; email: string; image: string | null } | null;
  creator: { id: string; name: string };
  subtasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
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

    const task = await db.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        estimatedHours: true,
        actualHours: true,
        tags: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        subtasks: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Tarea no encontrada" };
    }

    return { success: true, data: task };
  } catch (error) {
    console.error("[TASKS] Error fetching task:", error);
    return { success: false, error: "Error al obtener tarea" };
  }
}

/**
 * Create a new task
 */
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = createTaskSchema.parse(input);
    const db = await getPrismaWithSession(session);

    // Validate assignee is a member of the organization
    if (validatedData.assigneeId) {
      const member = await db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: session.session.activeOrganizationId,
            userId: validatedData.assigneeId,
          },
        },
      });

      if (!member) {
        return { success: false, error: "El usuario asignado no es miembro de la organización" };
      }
    }

    // Get max order for the status
    const maxOrderTask = await db.task.findFirst({
      where: {
        status: validatedData.status,
        parentId: validatedData.parentId || null,
        projectId: validatedData.projectId || null,
      },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderTask?.order ?? -1) + 1;

    const task = await db.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate,
        estimatedHours: validatedData.estimatedHours,
        projectId: validatedData.projectId || null,
        assigneeId: validatedData.assigneeId,
        parentId: validatedData.parentId || null,
        tags: validatedData.tags || [],
        order: newOrder,
        creatorId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
      select: { id: true, projectId: true },
    });

    // Recalculate project progress if task belongs to a project
    if (task.projectId) {
      await recalculateProjectProgress(task.projectId);
    }

    revalidatePath("/tasks");
    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath("/dashboard");

    return { success: true, data: { id: task.id } };
  } catch (error) {
    console.error("[TASKS] Error creating task:", error);
    return { success: false, error: "Error al crear tarea" };
  }
}

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = updateTaskSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const existingTask = await db.task.findUnique({
      where: { id },
      select: { id: true, status: true, projectId: true },
    });

    if (!existingTask) {
      return { success: false, error: "Tarea no encontrada" };
    }

    // Check if completing
    const isCompleting =
      validatedData.status === "DONE" && existingTask.status !== "DONE";

    await db.task.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description || null,
        }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.priority && { priority: validatedData.priority }),
        ...(validatedData.dueDate !== undefined && {
          dueDate: validatedData.dueDate,
        }),
        ...(validatedData.estimatedHours !== undefined && {
          estimatedHours: validatedData.estimatedHours,
        }),
        ...(validatedData.actualHours !== undefined && {
          actualHours: validatedData.actualHours,
        }),
        ...(validatedData.assigneeId !== undefined && {
          assigneeId: validatedData.assigneeId,
        }),
        ...(validatedData.projectId !== undefined && {
          projectId: validatedData.projectId,
        }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(isCompleting && { completedAt: new Date() }),
      },
    });

    // Recalculate project progress
    if (existingTask.projectId) {
      await recalculateProjectProgress(existingTask.projectId);
    }

    // Log completion activity
    if (isCompleting && existingTask.projectId) {
      await db.activity.create({
        data: {
          type: "TASK_COMPLETED",
          title: `Tarea completada`,
          projectId: existingTask.projectId,
          userId: session.user.id,
          organizationId: session.session.activeOrganizationId,
        },
      });
    }

    revalidatePath("/tasks");
    if (existingTask.projectId) {
      revalidatePath(`/projects/${existingTask.projectId}`);
    }

    return { success: true, data: { id } };
  } catch (error) {
    console.error("[TASKS] Error updating task:", error);
    return { success: false, error: "Error al actualizar tarea" };
  }
}

/**
 * Move a task (drag and drop)
 */
export async function moveTask(input: MoveTaskInput): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const validatedData = moveTaskSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const task = await db.task.findUnique({
      where: { id: validatedData.id },
      select: { id: true, status: true, projectId: true },
    });

    if (!task) {
      return { success: false, error: "Tarea no encontrada" };
    }

    const isCompleting =
      validatedData.status === "DONE" && task.status !== "DONE";

    await db.task.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        order: validatedData.order,
        ...(isCompleting && { completedAt: new Date() }),
      },
    });

    // Recalculate project progress
    if (task.projectId) {
      await recalculateProjectProgress(task.projectId);
    }

    revalidatePath("/tasks");
    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[TASKS] Error moving task:", error);
    return { success: false, error: "Error al mover tarea" };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const db = await getPrismaWithSession(session);

    const task = await db.task.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!task) {
      return { success: false, error: "Tarea no encontrada" };
    }

    await db.task.delete({ where: { id } });

    // Recalculate project progress
    if (task.projectId) {
      await recalculateProjectProgress(task.projectId);
    }

    revalidatePath("/tasks");
    if (task.projectId) {
      revalidatePath(`/projects/${task.projectId}`);
    }
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[TASKS] Error deleting task:", error);
    return { success: false, error: "Error al eliminar tarea" };
  }
}

/**
 * Get task statistics
 */
export async function getTaskStats(): Promise<ActionResponse<{
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  completedToday: number;
  myTasks: number;
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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      total,
      todo,
      inProgress,
      inReview,
      done,
      cancelled,
      low,
      medium,
      high,
      urgent,
      overdue,
      completedToday,
      myTasks,
    ] = await Promise.all([
      db.task.count({ where: { parentId: null } }),
      db.task.count({ where: { status: "TODO", parentId: null } }),
      db.task.count({ where: { status: "IN_PROGRESS", parentId: null } }),
      db.task.count({ where: { status: "IN_REVIEW", parentId: null } }),
      db.task.count({ where: { status: "DONE", parentId: null } }),
      db.task.count({ where: { status: "CANCELLED", parentId: null } }),
      db.task.count({ where: { priority: "LOW", parentId: null } }),
      db.task.count({ where: { priority: "MEDIUM", parentId: null } }),
      db.task.count({ where: { priority: "HIGH", parentId: null } }),
      db.task.count({ where: { priority: "URGENT", parentId: null } }),
      db.task.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["DONE", "CANCELLED"] },
          parentId: null,
        },
      }),
      db.task.count({
        where: {
          status: "DONE",
          completedAt: { gte: startOfDay },
          parentId: null,
        },
      }),
      db.task.count({
        where: {
          assigneeId: session.user.id,
          status: { notIn: ["DONE", "CANCELLED"] },
          parentId: null,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        byStatus: {
          TODO: todo,
          IN_PROGRESS: inProgress,
          IN_REVIEW: inReview,
          DONE: done,
          CANCELLED: cancelled,
        },
        byPriority: {
          LOW: low,
          MEDIUM: medium,
          HIGH: high,
          URGENT: urgent,
        },
        overdue,
        completedToday,
        myTasks,
      },
    };
  } catch (error) {
    console.error("[TASKS] Error fetching stats:", error);
    return { success: false, error: "Error al obtener estadisticas" };
  }
}
