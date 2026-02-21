import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user/delete
 *
 * Delete the authenticated user's account and all associated data.
 * This is a destructive action that cannot be undone.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete the user (cascade delete will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada exitosamente",
    });
  } catch (error) {
    console.error("[USER_DELETE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la cuenta" },
      { status: 500 }
    );
  }
}
