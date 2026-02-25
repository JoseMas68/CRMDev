"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Generar token de vinculación para Telegram
export async function generateTelegramLinkToken() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    // Generar token único
    const tokenBytes = randomBytes(4).toString("hex").toUpperCase();
    const token = `TG-${tokenBytes}`;

    // Crear token en base de datos
    const linkToken = await prisma.telegramLinkToken.create({
      data: {
        token,
        organizationId: activeOrganizationId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      },
    });

    return {
      success: true,
      data: {
        token: linkToken.token,
        expiresAt: linkToken.expiresAt,
      },
    };
  } catch (error) {
    console.error("[TELEGRAM_ACTION]", error);
    return { success: false, error: "Error al generar token" };
  }
}

// Obtener conexión de Telegram de la organización actual
export async function getTelegramConnection() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    const connections = await prisma.telegramConnection.findMany({
      where: {
        organizationId: activeOrganizationId,
        isActive: true,
      },
      orderBy: {
        linkedAt: "desc",
      },
    });

    return {
      success: true,
      data: connections,
    };
  } catch (error) {
    console.error("[TELEGRAM_ACTION]", error);
    return { success: false, error: "Error al obtener conexiones" };
  }
}

// Desvincular conexión de Telegram
export async function unlinkTelegram(connectionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { activeOrganizationId } = session.session;

    // Verificar que la conexión pertenece a la organización
    const connection = await prisma.telegramConnection.findFirst({
      where: {
        id: connectionId,
        organizationId: activeOrganizationId,
      },
    });

    if (!connection) {
      return { success: false, error: "Conexión no encontrada" };
    }

    // Desactivar conexión
    await prisma.telegramConnection.update({
      where: { id: connectionId },
      data: {
        isActive: false,
        unlinkedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[TELEGRAM_ACTION]", error);
    return { success: false, error: "Error al desvincular" };
  }
}
