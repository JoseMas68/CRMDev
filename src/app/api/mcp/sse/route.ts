import { NextRequest } from "next/server";
import { mcpServer, activeTransports } from "@/lib/mcp";
import { prisma } from "@/lib/prisma";
import { getCorsHeaders, handleOptionsRequest } from "@/lib/cors";

// Use Node.js runtime for Prisma support
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const apiKey = await prisma.apiKey.findUnique({
        where: { key: token },
    });

    if (!apiKey) {
        return new Response("Invalid API Key", { status: 403 });
    }

    // Update last used
    await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
    });

    const sessionId = crypto.randomUUID();

    // Controller reference for sending SSE events
    let controllerRef: ReadableStreamDefaultController<any>;

    const stream = new ReadableStream({
        start(controller) {
            controllerRef = controller;
            // Define the absolute POST endpoint for the client
            const url = new URL(req.url);
            const publicBase = process.env.NEXT_PUBLIC_MCP_PUBLIC_URL?.replace(/\/+$/, "");
            const postUrl = `${publicBase}/api/mcp/message?sessionId=${sessionId}`;
            controller.enqueue(`event: endpoint\ndata: ${postUrl}\n\n`);
        },
        cancel() {
            activeTransports.delete(sessionId);
        }
    });

    // Custom transport adapter for Next.js Web Streams
    const customTransport = {
        send: async (message: any) => {
            if (controllerRef) {
                controllerRef.enqueue(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
            }
        },
        close: async () => {
            if (controllerRef) controllerRef.close();
            activeTransports.delete(sessionId);
        },
        onmessage: undefined as any,
        onclose: undefined as any,
        onerror: undefined as any,
    };

    // Bind to our MCPServer
    mcpServer.connect(customTransport as any);

    // Store transport with organizationId for security in message handler
    activeTransports.set(sessionId, {
        transport: customTransport as any,
        organizationId: apiKey.organizationId,
    });

    // Return the web stream
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
        },
    });
}

// OPTIONS for CORS (Claude / other web-based clients sending preflights)
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin");
    return handleOptionsRequest(origin);
}
