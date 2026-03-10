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
 * Obtiene todos los usuarios con filtros
 */
export async function getAllUsers(filters?: {
  search?: string;
  isSuperAdmin?: boolean;
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
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Filtro por superadmin
    if (filters?.isSuperAdmin !== undefined) {
      where.isSuperAdmin = filters.isSuperAdmin;
    }

    const users = await prisma.user.findMany({
      where,
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
    console.error("Error fetching users:", error);
    return { success: false, error: "Error al obtener usuarios" };
  }
}

/**
 * Obtiene un usuario por ID
 */
export async function getUserById(id: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSuperAdmin: true,
        emailVerified: true,
        githubId: true,
        githubUsername: true,
        isVerifiedDev: true,
        createdAt: true,
        updatedAt: true,
        members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Error al obtener usuario" };
  }
}

/**
 * Toggle superadmin status de un usuario
 */
export async function toggleSuperAdmin(userId: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // No permitir que el último superadmin se degradue a sí mismo
    if (verification.session?.user?.id === userId && user.isSuperAdmin) {
      const superAdminCount = await prisma.user.count({
        where: { isSuperAdmin: true },
      });

      if (superAdminCount <= 1) {
        return {
          success: false,
          error: "No puedes degradarte a ti mismo si eres el único superadmin",
        };
      }
    }

    // Toggle superadmin
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin: !user.isSuperAdmin },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      data: {
        user: updatedUser,
        message: user.isSuperAdmin
          ? "Superadmin revocado"
          : "Superadmin otorgado",
      },
    };
  } catch (error) {
    console.error("Error toggling superadmin:", error);
    return { success: false, error: "Error al actualizar superadmin" };
  }
}

/**
 * Elimina un usuario
 */
export async function deleteUser(id: string) {
  const verification = await verifySuperAdmin();
  if (!verification.success) {
    return verification;
  }

  try {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // No permitir eliminarse a sí mismo
    if (verification.session?.user?.id === id) {
      return { success: false, error: "No puedes eliminar tu propio usuario" };
    }

    // Verificar si es el último superadmin
    if (user.isSuperAdmin) {
      const superAdminCount = await prisma.user.count({
        where: { isSuperAdmin: true },
      });

      if (superAdminCount <= 1) {
        return {
          success: false,
          error: "No puedes eliminar al último superadmin",
        };
      }
    }

    // Eliminar usuario (cascade delete se encargará de las relaciones)
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      data: {
        message: `Usuario "${user.name}" eliminado correctamente`,
      },
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Error al eliminar usuario" };
  }
}
