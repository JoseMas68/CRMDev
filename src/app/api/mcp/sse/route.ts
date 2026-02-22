import { NextRequest } from "next/server";
import { mcpServer, activeTransports } from "@/lib/mcp";
import { prisma } from "@/lib/prisma";

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

    // Note: SSEServerTransport typically expects Node's IncomingMessage/ServerResponse 
    // but there's a Web stream pattern or we can manage manual streams.
    // We'll use a TransformStream to bridge the gap.

    let controllerRef: ReadableStreamDefaultController<any>;

    const stream = new ReadableStream({
        start(controller) {
            controllerRef = controller;
            // Define the absolute POST endpoint for the client
            const url = new URL(req.url);
            const postUrl = `${url.protocol}//${url.host}/api/mcp/message?sessionId=${sessionId}`;
            controller.enqueue(`event: endpoint\ndata: ${postUrl}\n\n`);
        },
        cancel() {
            activeTransports.delete(sessionId);
        }
    });

    // Our custom adapter since SSEServerTransport in Node wants a res object
    // Next.js App Router forces Web Streams. We implement a dummy transport or write to the stream natively.
    // Actually, we can just instantiate a new SSEServerTransport via its raw protocol if needed,
    // but a simple custom Transport is trivial:
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
    activeTransports.set(sessionId, customTransport as any);

    // Return the web stream
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
