"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Verifica que el usuario sea superadmin
 */
async function verifySuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.isSuperAdmin) {
    return { success: false, error: "No autorizado: Se requiere superadmin" };
  }

  return { success: true, session };
}

/**
 * Obtiene estadísticas globales del SaaS
 */
export async function getGlobalStats() {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const [
      totalOrganizations,
      totalUsers,
      totalClients,
      totalProjects,
      totalTasks,
      activeOrganizations, // Activity en últimos 7 días
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.client.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.organization.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días
          },
        },
      }),
    ]);

    // Organizaciones creadas este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const organizationsThisMonth = await prisma.organization.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    return {
      success: true,
      data: {
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations,
          thisMonth: organizationsThisMonth,
        },
        users: {
          total: totalUsers,
        },
        entities: {
          totalClients,
          totalProjects,
          totalTasks,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return { success: false, error: "Error al obtener estadísticas" };
  }
}

/**
 * Obtiene estadísticas detalladas de organizaciones
 */
export async function getOrganizationsStats() {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          select: {
            plan: true,
          },
        },
        _count: {
          select: {
            members: true,
            clients: true,
            projects: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: organizations.map((org) => ({
        ...org,
        plan: org.subscription?.plan || "FREE",
      })),
    };
  } catch (error) {
    console.error("Error fetching organizations stats:", error);
    return { success: false, error: "Error al obtener estadísticas de organizaciones" };
  }
}

/**
 * Obtiene estadísticas detalladas de usuarios
 */
export async function getUsersStats() {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSuperAdmin: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("Error fetching users stats:", error);
    return { success: false, error: "Error al obtener estadísticas de usuarios" };
  }
}
