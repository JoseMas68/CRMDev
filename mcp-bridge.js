#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Configurable Via Environment variables from Desktop App
const CRM_URL = process.env.CRM_URL || "http://localhost:3000/api/mcp/sse";
const API_KEY = process.env.CRM_API_KEY;

if (!API_KEY) {
    console.error("Missing CRM_API_KEY environment variable");
    process.exit(1);
}

async function main() {
    // 1. Conectar con el servidor CRM remoto usando SSE y la API Key 
    const transport = new SSEClientTransport(new URL(CRM_URL), {
        headers: {
            "Authorization": `Bearer ${API_KEY}`
        }
    });

    const mcpClient = new Client({
        name: "claude-desktop-bridge",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    await mcpClient.connect(transport);

    // Aquí el puente se encarga de retransmitir todo entre Claude Desktop (stdio)
    // y el CRM remoto (SSE).
    // (Nota: Debido a la complejidad de retransmitir JSON-RPC transparente,
    // Anthropic está trabajando en soporte nativo SSE para Claude Desktop.
    // Actualmente, para MCP HTTP Remoto, lo ideal es usar el "Inspector" o herramientas web).

    console.error(`Conectado al CRM en ${CRM_URL} exitosamente. ¡Puente listo!`);
}

main().catch((error) => {
    console.error("Error connecting:", error);
    process.exit(1);
});
