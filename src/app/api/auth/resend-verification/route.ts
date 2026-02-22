import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 *
 * Resend verification email to a user
 * This is a custom endpoint since Better Auth doesn't provide a public resend API
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

    // Crear un nuevo token de verificación
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Crear URL de verificación
    // Better Auth maneja la verificación en /api/auth/verify-email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}&callbackURL=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/login`)}`;

    // Enviar email usando nuestra función
    const result = await sendVerificationEmail({
      email,
      verificationUrl,
    });

    if (!result.success) {
      console.error("[RESEND_VERIFICATION] Error sending email:", result.error);
      return NextResponse.json(
        { success: false, error: "Error al enviar email. Verifica que Resend esté configurado." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de verificación enviado correctamente",
    });
  } catch (error) {
    console.error("[RESEND_VERIFICATION] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar email de verificación" },
      { status: 500 }
    );
  }
}
