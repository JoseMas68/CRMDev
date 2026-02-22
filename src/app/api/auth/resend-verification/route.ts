import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

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

    // Enviar email de verificación usando Better Auth
    await auth.api.sendVerificationEmail({
      body: {
        email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email de verificación enviado",
    });
  } catch (error) {
    console.error("[RESEND_VERIFICATION] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar email de verificación" },
      { status: 500 }
    );
  }
}
