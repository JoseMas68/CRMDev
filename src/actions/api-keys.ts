"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getApiKeys() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado" };
        }

        const apiKeys = await prisma.apiKey.findMany({
            where: {
                organizationId: session.session.activeOrganizationId,
            },
            include: {
                user: {
                    select: { name: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: apiKeys };
    } catch (error) {
        console.error("[GET_API_KEYS]", error);
        return { success: false, error: "Error al cargar las llaves de API" };
    }
}

export async function createApiKey(name: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado" };
        }

        // Verify user is admin or owner
        const member = await prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: session.session.activeOrganizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!member || (member.role !== "owner" && member.role !== "admin")) {
            return { success: false, error: "Solo administradores pueden crear API Keys" };
        }

        // Generate a secure random token (e.g. crm_xxxxxxxxxxxxxxxx)
        const rawToken = randomBytes(24).toString("hex");
        const token = `crm_${rawToken}`;

        const newKey = await prisma.apiKey.create({
            data: {
                name,
                key: token,
                organizationId: session.session.activeOrganizationId,
                userId: session.user.id,
            },
        });

        revalidatePath("/settings/api-keys");
        return { success: true, data: newKey };
    } catch (error) {
        console.error("[CREATE_API_KEY]", error);
        return { success: false, error: "Error al crear la llave de API" };
    }
}

export async function deleteApiKey(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || !session.session.activeOrganizationId) {
            return { success: false, error: "No autenticado" };
        }

        const member = await prisma.member.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: session.session.activeOrganizationId,
                    userId: session.user.id,
                },
            },
        });

        if (!member || (member.role !== "owner" && member.role !== "admin")) {
            return { success: false, error: "Solo administradores pueden eliminar API Keys" };
        }

        await prisma.apiKey.delete({
            where: {
                id,
                organizationId: session.session.activeOrganizationId, // Ensure it belongs to org
            },
        });

        revalidatePath("/settings/api-keys");
        return { success: true };
    } catch (error) {
        console.error("[DELETE_API_KEY]", error);
        return { success: false, error: "Error al eliminar la llave de API" };
    }
}
