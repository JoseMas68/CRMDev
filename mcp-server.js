#!/usr/bin/env node

/**
 * MCP Server Proxy for Claude Desktop
 *
 * This server runs locally and connects to your CRMDev via REST API
 * Claude Desktop connects to this server via stdio
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuración
const API_URL = "https://crmdev.tech/api/mcp/rest";
const API_KEY = process.env.CRM_API_KEY || "crm_6df28433c4ec7ac15ef43d5fca54bbadc725452f81623cc5";

// Helper para llamar a la API REST
async function callTool(toolName, args = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      tool: toolName,
      arguments: args,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Crear servidor MCP
const server = new Server(
  {
    name: "crmdev-mcp-proxy",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

// Registrar tools
server.tool(
  "list_projects",
  "Listar todos los proyectos de la organización",
  {
    limit: z.number().optional().describe("Límite de proyectos"),
  },
  async ({ limit }) => {
    const result = await callTool("list_projects", { limit });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

server.tool(
  "create_project",
  "Crear un nuevo proyecto",
  {
    name: z.string().describe("Nombre del proyecto"),
    description: z.string().optional().describe("Descripción"),
    type: z.enum(["GITHUB", "WORDPRESS", "VERCEL", "OTHER"]).optional().describe("Tipo"),
  },
  async ({ name, description, type }) => {
    const result = await callTool("create_project", { name, description, type });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

server.tool(
  "list_tasks",
  "Listar tareas",
  {
    limit: z.number().optional().describe("Límite de tareas"),
    projectId: z.string().optional().describe("Filtrar por proyecto"),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional().describe("Estado"),
  },
  async ({ limit, projectId, status }) => {
    const result = await callTool("list_tasks", { limit, projectId, status });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

server.tool(
  "create_task",
  "Crear una nueva tarea",
  {
    title: z.string().describe("Título de la tarea"),
    description: z.string().optional().describe("Descripción"),
    projectId: z.string().optional().describe("ID del proyecto"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().describe("Prioridad"),
  },
  async ({ title, description, projectId, priority }) => {
    const result = await callTool("create_task", { title, description, projectId, priority });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

server.tool(
  "list_clients",
  "Listar clientes",
  {
    limit: z.number().optional().describe("Límite de clientes"),
  },
  async ({ limit }) => {
    const result = await callTool("list_clients", { limit });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

server.tool(
  "create_client",
  "Crear un nuevo cliente",
  {
    name: z.string().describe("Nombre del cliente"),
    email: z.string().email().optional().describe("Email"),
    company: z.string().optional().describe("Empresa"),
  },
  async ({ name, email, company }) => {
    const result = await callTool("create_client", { name, email, company });
    return {
      content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
    };
  }
);

// Iniciar servidor
async function main() {
  console.error("🚀 CRMDev MCP Proxy Server starting...");
  console.error(`📡 Connecting to ${API_URL}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("✅ CRMDev MCP Server running! Waiting for Claude Desktop...");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
