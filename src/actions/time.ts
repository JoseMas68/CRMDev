"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type TimeStats = {
    today: { hours: number; minutes: number; totalMinutes: number };
    thisWeek: { hours: number; minutes: number; totalMinutes: number };
    thisMonth: { hours: number; minutes: number; totalMinutes: number; billableMinutes: number };
};

export async function getTimeStats(): Promise<{ success: boolean; data?: TimeStats; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado o sin organización activa" };
        }

        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Day of week: 0 is Sunday, 1 is Monday. Let's assume week starts on Monday
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all relevant entries at once for this month to minimize DB queries
        const monthEntries = await prisma.timeEntry.findMany({
            where: {
                organizationId: orgId,
                userId: userId,
                startTime: {
                    gte: startOfMonth,
                },
            },
        });

        let todayMins = 0;
        let weekMins = 0;
        let monthMins = 0;
        let billableMins = 0;

        monthEntries.forEach((entry) => {
            const entryStart = new Date(entry.startTime);
            const isToday = entryStart >= startOfToday;
            const isThisWeek = entryStart >= startOfWeek;
            const isBillable = entry.billable;

            monthMins += entry.duration;
            if (isBillable) billableMins += entry.duration;
            if (isThisWeek) weekMins += entry.duration;
            if (isToday) todayMins += entry.duration;
        });

        return {
            success: true,
            data: {
                today: {
                    hours: Math.floor(todayMins / 60),
                    minutes: todayMins % 60,
                    totalMinutes: todayMins,
                },
                thisWeek: {
                    hours: Math.floor(weekMins / 60),
                    minutes: weekMins % 60,
                    totalMinutes: weekMins,
                },
                thisMonth: {
                    hours: Math.floor(monthMins / 60),
                    minutes: monthMins % 60,
                    totalMinutes: monthMins,
                    billableMinutes: billableMins,
                },
            },
        };
    } catch (error) {
        console.error("[GET_TIME_STATS_ERROR]", error);
        return { success: false, error: "Error al obtener estadísticas de tiempo" };
    }
}

export async function getProjectTimeReport(projectId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado o sin organización activa" };
        }

        const reportEntries = await prisma.timeEntry.findMany({
            where: {
                organizationId: session.session.activeOrganizationId,
                task: {
                    projectId,
                }
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                task: { select: { id: true, title: true } }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return { success: true, data: reportEntries };

    } catch (error) {
        console.error("[GET_PROJECT_TIME_ERROR]", error);
        return { success: false, error: "Error al obtener reporte de tiempo del proyecto" };
    }
}

export async function addManualTimeEntry(data: { taskId: string; duration: number; date: Date; description: string; billable?: boolean }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado" };
        }

        // Comprobar que la tarea existe y que al menos es de la org
        const task = await prisma.task.findFirst({
            where: { id: data.taskId, organizationId: session.session.activeOrganizationId }
        });

        if (!task) {
            return { success: false, error: "Tarea inaccesible o no existe" };
        }

        // duration is in minutes. Calculate start and end purely virtually (e.g. 09:00 to 09:00 + duration)
        const startTime = new Date(data.date);
        const endTime = new Date(startTime.getTime() + data.duration * 60000);

        const timeEntry = await prisma.timeEntry.create({
            data: {
                organizationId: session.session.activeOrganizationId,
                taskId: data.taskId,
                userId: session.user.id,
                duration: data.duration,
                startTime,
                endTime,
                description: data.description || "Entrada manual",
                billable: data.billable !== undefined ? data.billable : true
            }
        });

        return { success: true, data: timeEntry };
    } catch (error) {
        console.error("[ADD_MANUAL_TIME_ERROR]", error);
        return { success: false, error: "Error guardando el tiempo" };
    }
}
