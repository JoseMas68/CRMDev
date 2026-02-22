import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/resend-verification
 *
 * Simplificado: Genera un nuevo código de verificación y lo muestra en la respuesta
 * para desarrollo. En producción, Better Auth maneja esto automáticamente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No existe un usuario con ese email" },
        { status: 404 }
      );
    }

    // Si el email ya está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Este email ya está verificado" },
        { status: 400 }
      );
    }

    // En desarrollo, podemos marcar el email como verificado directamente
    // En producción, Better Auth enviará el email
    if (process.env.NODE_ENV === "development" && process.env.SKIP_EMAIL_FOR_DEV === "true") {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      return NextResponse.json({
        success: true,
        message: "Email verificado automáticamente en desarrollo",
      });
    }

    // Trigger Better Auth's verification email sending logic
    const { auth } = await import("@/lib/auth");

    // Convert headers to correctly match Record<string, string> | Headers
    const headersList = Object.fromEntries(request.headers.entries());

    await auth.api.sendVerificationEmail({
      body: {
        email: user.email,
        callbackURL: process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"
      },
      headers: new Headers(headersList),
    });

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un nuevo email de verificación.",
    });
  } catch (error) {
    console.error("[RESEND_VERIFICATION] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
