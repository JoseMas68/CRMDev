import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organizations/search
 *
 * Search for public organizations by name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "La búsqueda debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Search organizations by name or slug
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Filter out organizations where the user is already a member
    const userOrgIds = await prisma.member
      .findMany({
        where: { userId: session.user.id },
        select: { organizationId: true },
      })
      .then((members) => members.map((m) => m.organizationId));

    const availableOrgs = organizations.filter(
      (org) => !userOrgIds.includes(org.id)
    );

    return NextResponse.json({
      success: true,
      organizations: availableOrgs,
    });
  } catch (error) {
    console.error("[ORG_SEARCH] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al buscar organizaciones" },
      { status: 500 }
    );
  }
}
