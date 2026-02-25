import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

// Generar token temporal para vincular Telegram
// POST /api/telegram/generate-token
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión del usuario
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return NextResponse.json(
        { error: "Unauthorized - No active organization" },
        { status: 401 }
      );
    }

    const { activeOrganizationId } = session.session;

    // 2. Generar token único tipo "TG-XXXXX"
    const tokenBytes = randomBytes(4).toString("hex").toUpperCase();
    const token = `TG-${tokenBytes}`;

    // 3. Crear token en base de datos (expira en 10 minutos)
    const linkToken = await prisma.telegramLinkToken.create({
      data: {
        token,
        organizationId: activeOrganizationId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      },
    });

    // 4. Retornar token
    return NextResponse.json({
      token: linkToken.token,
      expires_in: 600, // segundos
      message: "Use este token en Telegram: /start " + token,
    });
  } catch (error) {
    console.error("[TELEGRAM_GENERATE_TOKEN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
