import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Get user's organizations
 * GET /api/user/organizations
 *
 * Returns all organizations where the user is a member
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
      orderBy: { createdAt: "asc" },
    });

    const organizations = memberships.map((member) => ({
      id: member.organization.id,
      name: member.organization.name,
      slug: member.organization.slug,
      logo: member.organization.logo,
      role: member.role,
      memberId: member.id,
    }));

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}
