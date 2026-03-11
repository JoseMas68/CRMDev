import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Debug endpoint to check user organizations
 * GET /api/debug/user-orgs
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's memberships directly from DB
    const { prisma } = await import("@/lib/prisma");

    const memberships = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      activeOrganizationId: session.session.activeOrganizationId,
      memberships: memberships,
      membershipCount: memberships.length,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
