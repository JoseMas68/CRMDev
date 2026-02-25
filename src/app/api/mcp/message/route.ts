import { NextRequest, NextResponse } from "next/server";
import { activeTransports } from "@/lib/mcp";

export async function POST(req: NextRequest) {
    // Authentication validation (similar to SSE for extra security)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, {
            status: 401,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Find the sessionId in the query params or URL
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, {
            status: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Find the exact transport matching this session
    const transport = activeTransports.get(sessionId);
    if (!transport) {
        return NextResponse.json({ error: "Session not found or disconnected" }, {
            status: 404,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
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

        return new Response("Accepted", {
            status: 202,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    } catch (error) {
        console.error("[MCP_POST_MESSAGE]", error);
        return NextResponse.json({ error: "Invalid JSON or Internal Error" }, {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }
}

// OPTIONS for CORS (Claude / other web-based clients sending preflights)
export async function OPTIONS() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    });
}
