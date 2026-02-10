"use server";

/**
 * Project Member Server Actions
 *
 * Security Notes:
 * - All actions validate session and activeOrganizationId
 * - Only owners/admins can manage project members
 * - Prisma middleware ensures tenant isolation for project lookups
 */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrismaWithSession, prisma } from "@/lib/prisma";

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

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
 * Get all members of a project
 */
export async function getProjectMembers(projectId: string): Promise<ActionResponse<
  Array<{
    id: string;
    role: string;
    createdAt: Date;
    user: { id: string; name: string; email: string; image: string | null };
  }>
>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Verify the project belongs to this organization
    const db = await getPrismaWithSession(session);
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return { success: true, data: members };
  } catch (error) {
    console.error("[PROJECT_MEMBERS] Error fetching members:", error);
    return { success: false, error: "Error al obtener miembros del proyecto" };
  }
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string = "member"
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Only owners/admins can add members
    const orgRole = await getOrgRole(session.user.id, session.session.activeOrganizationId);
    if (orgRole !== "owner" && orgRole !== "admin") {
      return { success: false, error: "No tienes permisos para gestionar miembros del proyecto" };
    }

    // Verify the project belongs to this organization
    const db = await getPrismaWithSession(session);
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return { success: false, error: "Proyecto no encontrado" };
    }

    // Verify the user is a member of this organization
    const orgMember = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.session.activeOrganizationId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!orgMember) {
      return { success: false, error: "El usuario no es miembro de la organización" };
    }

    // Check if already a project member
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existing) {
      return { success: false, error: "El usuario ya es miembro de este proyecto" };
    }

    const validRoles = ["lead", "member", "viewer"];
    const safeRole = validRoles.includes(role) ? role : "member";

    const projectMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role: safeRole,
      },
      select: { id: true },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return { success: true, data: { id: projectMember.id } };
  } catch (error) {
    console.error("[PROJECT_MEMBERS] Error adding member:", error);
    return { success: false, error: "Error al añadir miembro al proyecto" };
  }
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Only owners/admins can remove members
    const orgRole = await getOrgRole(session.user.id, session.session.activeOrganizationId);
    if (orgRole !== "owner" && orgRole !== "admin") {
      return { success: false, error: "No tienes permisos para gestionar miembros del proyecto" };
    }

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!existing) {
      return { success: false, error: "El usuario no es miembro de este proyecto" };
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[PROJECT_MEMBERS] Error removing member:", error);
    return { success: false, error: "Error al eliminar miembro del proyecto" };
  }
}

/**
 * Update a project member's role
 */
export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    const orgRole = await getOrgRole(session.user.id, session.session.activeOrganizationId);
    if (orgRole !== "owner" && orgRole !== "admin") {
      return { success: false, error: "No tienes permisos para gestionar miembros del proyecto" };
    }

    const validRoles = ["lead", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return { success: false, error: "Rol inválido" };
    }

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!existing) {
      return { success: false, error: "El usuario no es miembro de este proyecto" };
    }

    await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId },
      },
      data: { role },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[PROJECT_MEMBERS] Error updating role:", error);
    return { success: false, error: "Error al actualizar rol" };
  }
}

/**
 * Get organization members NOT yet in the project (for the add member selector)
 */
export async function getAvailableMembersForProject(projectId: string): Promise<ActionResponse<
  Array<{
    userId: string;
    name: string;
    email: string;
    image: string | null;
    orgRole: string;
  }>
>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
      return { success: false, error: "No autorizado" };
    }

    // Get users already in the project
    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });
    const existingUserIds = existingMembers.map((m) => m.userId);

    // Get org members not yet in the project
    const orgMembers = await prisma.member.findMany({
      where: {
        organizationId: session.session.activeOrganizationId,
        userId: { notIn: existingUserIds },
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: { name: true, email: true, image: true },
        },
      },
    });

    return {
      success: true,
      data: orgMembers.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        orgRole: m.role,
      })),
    };
  } catch (error) {
    console.error("[PROJECT_MEMBERS] Error fetching available members:", error);
    return { success: false, error: "Error al obtener miembros disponibles" };
  }
}
