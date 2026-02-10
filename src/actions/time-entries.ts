"use server";

/**
 * Time Entry Server Actions
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
import { getPrismaWithSession } from "@/lib/prisma";
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  startTimerSchema,
  stopTimerSchema,
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
  type StartTimerInput,
  type StopTimerInput,
} from "@/lib/validations/time-entry";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  billable: boolean;
  taskId: string;
  userId: string;
  createdAt: Date;
  task?: {
    id: string;
    title: string;
    project: { id: string; name: string } | null;
  };
  user?: {
    id: string;
    name: string;
    image: string | null;
  };
}

/**
 * Create a new time entry
 */
export async function createTimeEntry(
  input: CreateTimeEntryInput
): Promise<ActionResponse<TimeEntry>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = createTimeEntrySchema.parse(input);
    const db = await getPrismaWithSession(session);

    // Verify task belongs to organization
    const task = await db.task.findUnique({
      where: { id: validatedData.taskId },
      select: { id: true },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Calculate duration if both start and end times are provided
    let duration = validatedData.duration || 0;
    if (validatedData.startTime && validatedData.endTime) {
      duration = Math.floor(
        (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / 60000
      );
    }

    const timeEntry = await db.timeEntry.create({
      data: {
        organizationId: session.session.activeOrganizationId,
        taskId: validatedData.taskId,
        userId: session.user.id,
        description: validatedData.description || null,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime || null,
        duration,
        billable: validatedData.billable,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    revalidatePath("/time");
    revalidatePath("/tasks");

    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error creating time entry:", error);
    return { success: false, error: "Failed to create time entry" };
  }
}

/**
 * Update a time entry
 */
export async function updateTimeEntry(
  id: string,
  input: UpdateTimeEntryInput
): Promise<ActionResponse<TimeEntry>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateTimeEntrySchema.parse(input);
    const db = await getPrismaWithSession(session);

    // Calculate duration if both start and end times are provided
    let duration = validatedData.duration;
    if (validatedData.startTime && validatedData.endTime) {
      duration = Math.floor(
        (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / 60000
      );
    }

    const timeEntry = await db.timeEntry.update({
      where: { id },
      data: {
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration,
        billable: validatedData.billable,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    revalidatePath("/time");
    revalidatePath("/tasks");

    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error updating time entry:", error);
    return { success: false, error: "Failed to update time entry" };
  }
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(id: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    await db.timeEntry.delete({
      where: { id },
    });

    revalidatePath("/time");
    revalidatePath("/tasks");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return { success: false, error: "Failed to delete time entry" };
  }
}

/**
 * Start a timer for a task
 */
export async function startTimer(
  input: StartTimerInput
): Promise<ActionResponse<TimeEntry>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = startTimerSchema.parse(input);
    const db = await getPrismaWithSession(session);

    // Check if user already has an active timer
    const activeTimer = await db.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    });

    if (activeTimer) {
      return { success: false, error: "You already have an active timer. Stop it first." };
    }

    // Verify task belongs to organization
    const task = await db.task.findUnique({
      where: { id: validatedData.taskId },
      select: { id: true },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const timeEntry = await db.timeEntry.create({
      data: {
        organizationId: session.session.activeOrganizationId,
        taskId: validatedData.taskId,
        userId: session.user.id,
        description: validatedData.description || null,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        billable: true,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    revalidatePath("/time");
    revalidatePath("/tasks");

    return { success: true, data: timeEntry };
  } catch (error) {
    console.error("Error starting timer:", error);
    return { success: false, error: "Failed to start timer" };
  }
}

/**
 * Stop the active timer
 */
export async function stopTimer(
  input: StopTimerInput
): Promise<ActionResponse<TimeEntry>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = stopTimerSchema.parse(input);
    const db = await getPrismaWithSession(session);

    const timeEntry = await db.timeEntry.findUnique({
      where: { id: validatedData.entryId },
    });

    if (!timeEntry) {
      return { success: false, error: "Time entry not found" };
    }

    if (timeEntry.endTime) {
      return { success: false, error: "Timer is already stopped" };
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - timeEntry.startTime.getTime()) / 60000
    );

    const updatedEntry = await db.timeEntry.update({
      where: { id: validatedData.entryId },
      data: {
        endTime,
        duration,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    revalidatePath("/time");
    revalidatePath("/tasks");

    return { success: true, data: updatedEntry };
  } catch (error) {
    console.error("Error stopping timer:", error);
    return { success: false, error: "Failed to stop timer" };
  }
}

/**
 * Get the active timer for current user
 */
export async function getActiveTimer(): Promise<ActionResponse<TimeEntry | null>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    const activeTimer = await db.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return { success: true, data: activeTimer };
  } catch (error) {
    console.error("Error getting active timer:", error);
    return { success: false, error: "Failed to get active timer" };
  }
}

/**
 * Get time entries for a specific task
 */
export async function getTimeEntriesForTask(
  taskId: string
): Promise<ActionResponse<TimeEntry[]>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    const entries = await db.timeEntry.findMany({
      where: { taskId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return { success: true, data: entries };
  } catch (error) {
    console.error("Error getting time entries for task:", error);
    return { success: false, error: "Failed to get time entries" };
  }
}

/**
 * Get time entries for the current week
 */
export async function getTimeEntriesThisWeek(): Promise<
  ActionResponse<{
    entries: TimeEntry[];
    totalMinutes: number;
    billableMinutes: number;
  }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    // Calculate start of week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const entries = await db.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfWeek,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableMinutes = entries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + entry.duration, 0);

    return {
      success: true,
      data: {
        entries,
        totalMinutes,
        billableMinutes,
      },
    };
  } catch (error) {
    console.error("Error getting time entries for week:", error);
    return { success: false, error: "Failed to get time entries" };
  }
}

/**
 * Get time entries for today
 */
export async function getTimeEntriesToday(): Promise<
  ActionResponse<{
    entries: TimeEntry[];
    totalMinutes: number;
  }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const entries = await db.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfDay,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);

    return {
      success: true,
      data: {
        entries,
        totalMinutes,
      },
    };
  } catch (error) {
    console.error("Error getting time entries for today:", error);
    return { success: false, error: "Failed to get time entries" };
  }
}

/**
 * Get time summary for the current month
 */
export async function getTimeEntriesThisMonth(): Promise<
  ActionResponse<{
    totalMinutes: number;
    billableMinutes: number;
    entryCount: number;
  }>
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getPrismaWithSession(session);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const entries = await db.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfMonth,
        },
      },
      select: {
        duration: true,
        billable: true,
      },
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableMinutes = entries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + entry.duration, 0);

    return {
      success: true,
      data: {
        totalMinutes,
        billableMinutes,
        entryCount: entries.length,
      },
    };
  } catch (error) {
    console.error("Error getting time entries for month:", error);
    return { success: false, error: "Failed to get time entries" };
  }
}
