import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// Schema para validar request
const linkRequestSchema = z.object({
  token: z.string().regex(/^TG-[A-Z0-9]+$/, "Invalid token format"),
  telegramUserId: z.union([z.string(), z.number()]).transform(val => BigInt(val)),
  telegramUsername: z.string().optional(),
  telegramChatId: z.union([z.string(), z.number()]).optional().transform(val => val ? BigInt(val) : null),
});

// Vincular usuario de Telegram con organización
// POST /api/telegram/link
export async function POST(req: NextRequest) {
  try {
    // 1. Validar request
    const body = await req.json();
    const { token, telegramUserId, telegramUsername, telegramChatId } = linkRequestSchema.parse(body);

    // 2. Buscar token
    const linkToken = await prisma.telegramLinkToken.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!linkToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 404 }
      );
    }

    // 3. Verificar que no esté usado
    if (linkToken.used) {
      return NextResponse.json(
        { error: "Token already used" },
        { status: 400 }
      );
    }

    // 4. Verificar que no esté expirado
    if (linkToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 400 }
      );
    }

    // 5. Verificar si ya existe conexión para este usuario
    const existingConnection = await prisma.telegramConnection.findUnique({
      where: { telegramUserId },
    });

    if (existingConnection) {
      // Si ya existe conexión con otra org, actualizar
      if (existingConnection.organizationId !== linkToken.organizationId) {
        await prisma.telegramConnection.update({
          where: { id: existingConnection.id },
          data: {
            organizationId: linkToken.organizationId,
            telegramUsername: telegramUsername || existingConnection.telegramUsername,
            telegramChatId: telegramChatId || existingConnection.telegramChatId,
            isActive: true,
            linkedAt: new Date(),
            unlinkedAt: null,
          },
        });
      } else {
        // Ya está vinculado a esta org
        return NextResponse.json({
          success: true,
          message: "Ya estás vinculado a esta organización",
          organization: linkToken.organization.name,
        });
      }
    } else {
      // 6. Crear nueva conexión
      await prisma.telegramConnection.create({
        data: {
          organizationId: linkToken.organizationId,
          telegramUserId,
          telegramUsername,
          telegramChatId,
        },
      });
    }

    // 7. Marcar token como usado
    await prisma.telegramLinkToken.update({
      where: { id: linkToken.id },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: "Conectado correctamente",
      organization: linkToken.organization.name,
    });
  } catch (error) {
    console.error("[TELEGRAM_LINK]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
