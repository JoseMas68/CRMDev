import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrismaWithSession } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 segundos para responses largos

// Funciones disponibles para el agente
const tools = [
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "Listar todas las tareas de la organización",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"],
            description: "Filtrar por estado (opcional)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Crear una nueva tarea",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título de la tarea",
          },
          description: {
            type: "string",
            description: "Descripción detallada (opcional)",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Prioridad de la tarea",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_projects",
      description: "Listar todos los proyectos de la organización",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"],
            description: "Filtrar por estado (opcional)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_project",
      description: "Crear un nuevo proyecto",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre del proyecto",
          },
          description: {
            type: "string",
            description: "Descripción del proyecto (opcional)",
          },
          type: {
            type: "string",
            enum: ["GITHUB", "WORDPRESS", "VERCEL", "OTHER"],
            description: "Tipo de proyecto",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_clients",
      description: "Listar todos los clientes de la organización",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE", "CHURNED"],
            description: "Filtrar por estado (opcional)",
          },
        },
      },
    },
  },
];

// Ejecutar función de herramienta
async function executeTool(
  toolName: string,
  args: any,
  db: any
): Promise<any> {
  switch (toolName) {
    case "list_tasks":
      return await db.task.findMany({
        where: {
          ...(args.status && { status: args.status }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

    case "create_task": {
      const session = await auth.api.getSession({ headers: await headers() });
      return await db.task.create({
        data: {
          title: args.title,
          description: args.description,
          status: args.status || "TODO",
          priority: args.priority || "MEDIUM",
          organizationId: session?.session?.activeOrganizationId || "",
          creatorId: session?.user?.id || "",
        },
        select: { id: true, title: true, status: true, priority: true },
      });
    }

    case "list_projects":
      return await db.project.findMany({
        where: {
          ...(args.status && { status: args.status }),
        },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          type: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

    case "create_project": {
      const session = await auth.api.getSession({ headers: await headers() });
      return await db.project.create({
        data: {
          name: args.name,
          description: args.description,
          type: args.type || "OTHER",
          status: "NOT_STARTED",
          organizationId: session?.session?.activeOrganizationId || "",
        },
        select: { id: true, name: true, status: true },
      });
    }

    case "list_clients":
      return await db.client.findMany({
        where: {
          ...(args.status && { status: args.status }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// POST /api/ai/chat
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar sesión
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activeOrganizationId } = session.session;

    // 2. Obtener API Key de OpenAI de la organización
    const org = await prisma.organization.findUnique({
      where: { id: activeOrganizationId },
      select: { openaiApiKey: true },
    });

    if (!org?.openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Go to Settings → AI Assistant" },
        { status: 400 }
      );
    }

    // 3. Parsear request
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 4. Inicializar OpenAI
    const openai = new OpenAI({ apiKey: org.openaiApiKey });

    // 5. Obtener Prisma con session para tenant isolation
    const db = await getPrismaWithSession(session);

    // 6. Crear mensajes para la API
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Eres un asistente útil para un CRM (Customer Relationship Management).

Tu objetivo es ayudar al usuario a gestionar sus tareas, proyectos y clientes usando lenguaje natural.

INSTRUCCIONES IMPORTANTES:
- Siempre responde en el mismo idioma que el usuario (español, inglés, etc.)
- Sé conciso y directo
- Cuando crees algo, confirma con un ✅
- Cuando listes elementos, usa formato numeral
- Si el usuario pregunta algo que no requiere herramientas, responde directamente
- NO inventes datos que no existen

Ejemplos de respuestas:
- "Tienes 5 tareas pendientes:"
- "✅ Tarea creada: Llamar a Juan"
- "No hay proyectos con ese estado"`,
      },
      ...history,
      { role: "user", content: message },
    ];

    // 7. Llamar a OpenAI con function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0].message;

    // 8. Manejar tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults: any[] = [];

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        try {
          // Ejecutar la función
          const result = await executeTool(functionName, functionArgs, db);

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result),
          });
        } catch (error) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ error: (error as Error).message }),
          });
        }
      }

      // Obtener respuesta final de OpenAI con los resultados de las herramientas
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...messages,
          responseMessage,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return NextResponse.json({
        message: finalResponse.choices[0].message.content,
        toolCalls: toolResults.map((tr) => ({
          name: responseMessage.tool_calls?.find((tc) => tc.id === tr.tool_call_id)?.function.name,
          result: JSON.parse(tr.content),
        })),
      });
    }

    // 9. Retornar respuesta simple (sin tool calls)
    return NextResponse.json({
      message: responseMessage.content,
    });
  } catch (error) {
    console.error("[AI_CHAT]", error);

    // Manejar errores específicos de OpenAI
    if (error && typeof error === "object" && "status" in error) {
      const openAIError = error as any;
      if (openAIError.status === 401) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key. Please check your Settings → AI Assistant" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
