#!/usr/bin/env node

/**
 * CRMDev MCP Server - Instalador para Claude Desktop
 *
 * Este script descarga el servidor MCP y configura Claude Desktop automáticamente.
 *
 * Uso:
 *   node install-mcp.js <TU_API_KEY>
 *
 * Ejemplo:
 *   node install-mcp.js crm_abc123def456...
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, homedir } from "path";
import { execSync } from "child_process";

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.error("❌ ERROR: Debes proporcionar tu API Key");
  console.error("\nUso: node install-mcp.js <TU_API_KEY>");
  console.error("\nObtén tu API Key desde: https://crmdev.tech/settings/api-keys");
  process.exit(1);
}

// El código del servidor MCP (inline para que funcione sin descargar archivos externos)
const MCP_SERVER_CODE = `#!/usr/bin/env node

/**
 * CRMDev MCP Server for Claude Desktop
 * Downloaded from https://crmdev.tech
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = "https://crmdev.tech/api/mcp/rest";
const API_KEY = process.env.CRM_API_KEY;

if (!API_KEY) {
  console.error("❌ ERROR: CRM_API_KEY environment variable is not set!");
  process.exit(1);
}

async function callTool(toolName, args = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({ tool: toolName, arguments: args }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || \`HTTP \${response.status}\`);
  }

  return response.json();
}

const server = new Server(
  { name: "crmdev-mcp", version: "1.0.0" },
  { capabilities: {} }
);

// Register all tools
server.tool("list_projects", "Listar proyectos", {
  limit: z.number().optional(),
}, async ({ limit }) => {
  const result = await callTool("list_projects", { limit });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

server.tool("create_project", "Crear proyecto", {
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["GITHUB", "WORDPRESS", "VERCEL", "OTHER"]).optional(),
}, async ({ name, description, type }) => {
  const result = await callTool("create_project", { name, description, type });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

server.tool("list_tasks", "Listar tareas", {
  limit: z.number().optional(),
  projectId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
}, async ({ limit, projectId, status }) => {
  const result = await callTool("list_tasks", { limit, projectId, status });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

server.tool("create_task", "Crear tarea", {
  title: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
}, async ({ title, description, projectId, priority }) => {
  const result = await callTool("create_task", { title, description, projectId, priority });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

server.tool("list_clients", "Listar clientes", {
  limit: z.number().optional(),
}, async ({ limit }) => {
  const result = await callTool("list_clients", { limit });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

server.tool("create_client", "Crear cliente", {
  name: z.string(),
  email: z.string().email().optional(),
  company: z.string().optional(),
}, async ({ name, email, company }) => {
  const result = await callTool("create_client", { name, email, company });
  return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ CRMDev MCP Server running");
`;

// Detectar plataforma
const isWindows = process.platform === "win32";
const configDir = isWindows
  ? join(process.env.APPDATA || "", "Claude")
  : join(homedir(), ".config", "claude");

const configFile = join(configDir, "claude_desktop_config.json");
const serverFile = join(configDir, "crmdev-mcp-server.js");

console.log("🚀 Instalando CRMDev MCP para Claude Desktop...\n");

// Crear directorio si no existe
try {
  execSync(`mkdir -p "${configDir}"`, { shell: true, stdio: "ignore" });
} catch (e) {
  // Directorio ya existe o error menor, continuar
}

// Escribir el servidor MCP
writeFileSync(serverFile, MCP_SERVER_CODE);
console.log(`✅ Servidor MCP instalado en: ${serverFile}`);

// Leer o crear config
let config = { mcpServers: {} };
if (existsSync(configFile)) {
  try {
    const configContent = readFileSync(configFile, "utf-8");
    config = JSON.parse(configContent);
  } catch (e) {
    console.log("⚠️  Config existente no válido, creando nuevo...");
  }
}

// Agregar servidor CRMDev
config.mcpServers = config.mcpServers || {};
config.mcpServers.crmdev = {
  command: "node",
  args: [serverFile],
  env: {
    CRM_API_KEY: API_KEY,
  },
};

// Escribir config
writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(`✅ Configuración guardada en: ${configFile}`);

console.log("\n✨ ¡Instalación completada!");
console.log("\n📋 Siguientes pasos:");
console.log("   1. Reinicia Claude Desktop completamente");
console.log("   2. En un chat nuevo, prueba: \"¿Qué proyectos tengo?\"");
console.log("\n🔒 Tu API Key está guardada en la config de Claude Desktop");
console.log("   Puedes revocarla desde: https://crmdev.tech/settings/api-keys\n");
