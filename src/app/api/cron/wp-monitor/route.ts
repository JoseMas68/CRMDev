import { NextRequest, NextResponse } from "next/server";
import { checkAllWordPressSites } from "@/actions/wordpress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verify cron authorization using CRON_SECRET env var
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If no secret configured, allow only in development
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check all WordPress sites
    const result = await checkAllWordPressSites();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result.data,
    });
  } catch (error) {
    console.error("[CRON] WordPress monitoring error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also allow POST for testing and manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
