import { NextRequest, NextResponse } from "next/server";
import { activeTransports } from "@/lib/mcp";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

// Helper to create response with CORS headers
function createJsonResponse(data: any, status: number, origin: string | null) {
  const corsHeaders = getCorsHeaders(origin);
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

function createTextResponse(data: string, status: number, origin: string | null) {
  const corsHeaders = getCorsHeaders(origin);
  return new Response(data, {
    status,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
    const origin = req.headers.get("origin");

    // Authentication validation (similar to SSE for extra security)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return createJsonResponse({ error: "Unauthorized" }, 401, origin);
    }

    // Find the sessionId in the query params or URL
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
        return createJsonResponse({ error: "Missing sessionId" }, 400, origin);
    }

    // Find the exact transport matching this session
    const transport = activeTransports.get(sessionId);
    if (!transport) {
        return createJsonResponse({ error: "Session not found or disconnected" }, 404, origin);
    }

    try {
        const body = await req.json();

        // Emulate the receive message for the MCP SDK Transport
        // transport is now { transport: actualTransport, organizationId: string }
        if (typeof transport.transport.onmessage === "function") {
            // Inject the real organizationId from the session
            const _meta = { organizationId: transport.organizationId };
            transport.transport.onmessage({ ...body, _meta });
        }

        return createTextResponse("Accepted", 202, origin);
    } catch (error) {
        console.error("[MCP_POST_MESSAGE]", error);
        return createJsonResponse({ error: "Invalid JSON or Internal Error" }, 500, origin);
    }
}

// OPTIONS for CORS (Claude / other web-based clients sending preflights)
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    return handleOptionsRequest(origin);
}
