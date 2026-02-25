import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Resolver API key desde Telegram user ID
// GET /api/telegram/resolve/:telegramUserId
//
// Este endpoint es usado por n8n para obtener la API key correcta
// del tenant correspondiente al usuario de Telegram.
//
// Flujo:
// 1. Usuario escribe mensaje en Telegram
// 2. n8n recibe mensaje con telegramUserId
// 3. n8n llama a este endpoint
// 4. Endpoint devuelve organization info y API key
// 5. n8n usa esa API key para llamar al CRM
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ telegramUserId: string }> }
) {
  try {
    const { telegramUserId } = await params;

    // 1. Convertir telegramUserId a BigInt
    const userId = BigInt(telegramUserId);

    // 2. Buscar conexión activa
    const connection = await prisma.telegramConnection.findUnique({
      where: { telegramUserId: userId },
      include: {
        organization: {
          include: {
            // Obtener primera API key activa de la organización
            apiKeys: {
              where: { expiresAt: null }, // Solo API keys sin expiración
              take: 1,
            },
          },
        },
      },
    });

    // 3. Verificar que existe conexión
    if (!connection) {
      return NextResponse.json(
        { error: "not_linked", message: "Telegram user not linked to any organization" },
        { status: 404 }
      );
    }

    // 4. Verificar que está activa
    if (!connection.isActive) {
      return NextResponse.json(
        { error: "inactive", message: "Connection is inactive" },
        { status: 403 }
      );
    }

    // 5. Verificar que la organización tiene API key
    if (!connection.organization.apiKeys || connection.organization.apiKeys.length === 0) {
      return NextResponse.json(
        { error: "no_api_key", message: "Organization has no active API key" },
        { status: 404 }
      );
    }

    const apiKey = connection.organization.apiKeys[0];

    // 6. Retornar datos de la organización y API key
    return NextResponse.json({
      organization: {
        id: connection.organization.id,
        name: connection.organization.name,
        slug: connection.organization.slug,
      },
      api_key: apiKey.key,
      telegram_username: connection.telegramUsername,
    });
  } catch (error) {
    console.error("[TELEGRAM_RESOLVE]", error);

    // Error al parsear BigInt
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "invalid_user_id", message: "Invalid Telegram user ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
