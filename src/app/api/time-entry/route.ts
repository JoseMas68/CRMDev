import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/time-entry
 *
 * Create a new time entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, startTime, endTime, duration, description } = body;

    // Validate required fields
    if (!taskId || !startTime || !endTime || !duration) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organizationId: session.session.activeOrganizationId!,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        organizationId: session.session.activeOrganizationId!,
        taskId,
        userId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        description: description || `Trabajo en: ${task.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: timeEntry,
    });
  } catch (error) {
    console.error("[TIME_ENTRY] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear entrada de tiempo" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/time-entry
 *
 * Get time entries for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        organizationId: session.session.activeOrganizationId!,
        userId: session.user.id,
      },
      include: {
        task: {
          include: {
            project: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: timeEntries,
    });
  } catch (error) {
    console.error("[TIME_ENTRY] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener entradas de tiempo" },
      { status: 500 }
    );
  }
}
