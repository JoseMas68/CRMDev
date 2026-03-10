"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Verifica que el usuario sea superadmin
 */
async function verifySuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.isSuperAdmin) {
    return { success: false, error: "No autorizado: Se requiere superadmin" } as const;
  }

  return { success: true, session } as const;
}

/**
 * Obtiene todas las organizaciones con filtros
 */
export async function getAllOrganizations(filters?: {
  search?: string;
  plan?: string;
  active?: boolean;
}) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const where: any = {};

    // Filtro de búsqueda
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Filtro por plan
    if (filters?.plan) {
      where.plan = filters.plan;
    }

    // Filtro por actividad (activas = actividad en últimos 30 días)
    if (filters?.active === true) {
      where.updatedAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    } else if (filters?.active === false) {
      where.updatedAt = {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    const organizations = await prisma.organization.findMany({
      where,
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
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: true,
          },
          where: {
            role: "owner",
          },
          take: 1,
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
        owner: org.members[0]?.user || null,
        members: org._count.members,
        clients: org._count.clients,
        projects: org._count.projects,
        tasks: org._count.tasks,
      })),
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return { success: false, error: "Error al obtener organizaciones" };
  }
}

/**
 * Obtiene una organización por ID con todos sus detalles
 */
export async function getOrganizationById(id: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: {
          select: {
            plan: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            clients: true,
            projects: true,
            tasks: true,
            members: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!organization) {
      return { success: false, error: "Organización no encontrada" };
    }

    // Obtener actividades recientes
    const recentActivities = await prisma.activity.findMany({
      where: {
        organizationId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // Obtener integraciones
    const projects = await prisma.project.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        name: true,
        type: true,
        repoUrl: true,
        wpUrl: true,
        vercelUrl: true,
      },
    });

    const hasGitHub = projects.some((p) => p.repoUrl);
    const hasWordPress = projects.some((p) => p.wpUrl);
    const hasVercel = projects.some((p) => p.vercelUrl);

    // Obtener API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: {
        ...organization,
        plan: organization.subscription?.plan || "FREE",
        recentActivities,
        integrations: {
          github: hasGitHub,
          wordpress: hasWordPress,
          vercel: hasVercel,
        },
        apiKeys,
      },
    };
  } catch (error) {
    console.error("Error fetching organization:", error);
    return { success: false, error: "Error al obtener organización" };
  }
}

/**
 * Elimina una organización
 */
export async function deleteOrganization(id: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return { success: false, error: "Organización no encontrada" };
    }

    // Eliminar organización (Prisma borrará en cascada relaciones)
    await prisma.organization.delete({
      where: { id },
    });

    revalidatePath("/admin/organizations");

    return {
      success: true,
      data: { message: "Organización eliminada correctamente" },
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: "Error al eliminar organización" };
  }
}

/**
 * Transfiere el ownership de una organización
 */
export async function transferOwnership(orgId: string, newOwnerId: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          where: { role: "owner" },
        },
      },
    });

    if (!organization) {
      return { success: false, error: "Organización no encontrada" };
    }

    // Verificar que el nuevo owner es miembro
    const newOwnerMember = organization.members.find(
      (m) => m.userId === newOwnerId
    );

    if (!newOwnerMember) {
      return { success: false, error: "El usuario no es miembro de esta organización" };
    }

    // Actualizar roles: owner actual → admin, nuevo miembro → owner
    await prisma.$transaction([
      // Demote current owner to admin
      prisma.member.update({
        where: {
          id: organization.members[0].id,
        },
        data: { role: "admin" },
      }),
      // Promote new member to owner
      prisma.member.update({
        where: {
          id: newOwnerMember.id,
        },
        data: { role: "owner" },
      }),
    ]);

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);

    return {
      success: true,
      data: { message: "Ownership transferido correctamente" },
    };
  } catch (error) {
    console.error("Error transferring ownership:", error);
    return { success: false, error: "Error al transferir ownership" };
  }
}
