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
      description: "Crear una nueva tarea. Opcionalmente puedes asociarla a un proyecto y asignarla a un miembro.",
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
          projectId: {
            type: "string",
            description: "ID del proyecto al que asociar la tarea (opcional). Debe obtenerse de list_projects primero",
          },
          assigneeId: {
            type: "string",
            description: "ID del miembro al que asignar la tarea (opcional). Debe obtenerse de list_members primero",
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
  {
    type: "function" as const,
    function: {
      name: "list_members",
      description: "Listar todos los miembros de la organización (para ver quién está disponible)",
      parameters: {
        type: "object",
        properties: {},
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
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      });

    case "create_task": {
      const session = await auth.api.getSession({ headers: await headers() });

      // Verify project exists and belongs to org if provided
      if (args.projectId) {
        const project = await db.project.findFirst({
          where: { id: args.projectId },
          select: { id: true },
        });
        if (!project) {
          throw new Error("Proyecto no encontrado");
        }
      }

      // Verify member exists and belongs to org if provided
      if (args.assigneeId) {
        const member = await db.member.findFirst({
          where: { id: args.assigneeId, organizationId: session?.session?.activeOrganizationId },
          select: { id: true },
        });
        if (!member) {
          throw new Error("Miembro no encontrado en tu organización");
        }
      }

      return await db.task.create({
        data: {
          title: args.title,
          description: args.description,
          projectId: args.projectId || null,
          assigneeId: args.assigneeId || null,
          status: "TODO",
          priority: args.priority || "MEDIUM",
          organizationId: session?.session?.activeOrganizationId || "",
          creatorId: session?.user?.id || "",
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { name: true } },
          assignee: { select: { name: true } },
        },
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
          client: {
            select: {
              name: true,
            },
          },
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

    case "list_members":
      return await db.member.findMany({
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: 50,
        orderBy: { createdAt: "asc" },
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
        content: `Eres un asistente inteligente para CRMDev, un sistema de gestión de proyectos y tareas.

🎯 TU OBJETIVO:
Ayudar al usuario a gestionar tareas, proyectos, clientes y miembros del equipo usando lenguaje natural.

📊 ESTRUCTURA DEL CRM:
- CLIENTES: Leads, prospectos y clientes que la empresa gestiona
- PROYECTOS: Trabajos organizados por cliente (web, apps, marketing, etc.)
- TAREAS: Actividades específicas que pueden tener proyecto y asignatario
- MIEMBROS: Personas del equipo que pueden ser asignadas a tareas

🔗 RELACIONES IMPORTANTES:
- Los PROYECTOS agrupan TAREAS relacionadas
- Las TAREAS tienen un ASIGNADO (assignee) que es un MIEMBRO del equipo
- Las tareas pueden tener proyecto, asignatario, ambos, o ninguno
- Para asignar una tarea, necesitas el ID del miembro de list_members

⚠️ REGLAS DE ORO:

1. ANTES de crear o asignar tareas:
   - Usa list_projects para ver proyectos disponibles
   - Usa list_members para ver miembros disponibles
   - Usa list_tasks para ver asignaciones actuales

2. Si el usuario pregunta "¿Quién está asignado a X?" o "¿Qué tareas tiene Juan?":
   - PRIMERO: list_members para obtener IDs y nombres
   - SEGUNDO: list_tasks para ver tareas con sus asignados
   - ANALIZA: qué tareas tiene cada miembro

3. Si el usuario dice "Asignar tarea a Juan" o "Juan se encarga de...":
   - Busca a Juan en list_members → obtener su ID
   - Usa ese ID como assigneeId en create_task

4. Para detectar carga de trabajo:
   - list_tasks muestra todas las tareas con sus asignados
   - Cuenta cuántas tareas tiene cada miembro
   - Reporta quién está sobrecargado o disponible

5. SIEMPRE responde en el mismo idioma del usuario (español, inglés, etc.)

📝 EJEMPLOS DE INTERACCIÓN:

Usuario: "¿Qué tareas tiene Juan?"
Asistente:
1. list_members → encontrar ID de Juan
2. list_tasks → ver todas las tareas con asignados
3. Filtrar tareas donde assignee.name es "Juan"
4. "Juan tiene 3 tareas: Fix bug login, Revisar PR #42, Actualizar docs"

Usuario: "¿Quiénes están disponibles? ¿Quién tiene menos tareas?"
Asistente:
1. list_tasks → ver todas las tareas con asignados
2. Contar tareas por asignado
3. "María tiene 2 tareas, Juan tiene 5, Pedro no tiene tareas asignadas"
4. "Pedro está más disponible"

Usuario: "Asignar la tarea de arreglar el carrito a María"
Asistente:
1. list_members → buscar a María, obtener su ID
2. create_task con assigneeId de María
3. "✅ Tarea creada: Arreglar carrito (asignada a María)"

Usuario: "Crear tarea urgente para el proyecto E-commerce: revisar stock"
Asistente:
1. list_projects → buscar "E-commerce", obtener ID
2. list_members → ver quién está disponible
3. create_task con projectId y assigneeId
4. "✅ Tarea creada: Revisar stock (E-commerce, asignada a Pedro)"

💡 CONSEJOS:
- Siempre muestra el NOMBRE del asignado, no solo el ID
- Sé específico: "Juan tiene 5 tareas" es mejor que "Hay tareas asignadas"
- Si alguien está sobrecargado, sugiere redistribuir`,
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
        if (toolCall.type !== 'function') continue;

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
        toolCalls: toolResults.map((tr) => {
          const toolCall = responseMessage.tool_calls?.find((tc) => tc.id === tr.tool_call_id);
          return {
            name: toolCall?.type === 'function' ? toolCall.function.name : undefined,
            result: JSON.parse(tr.content),
          };
        }),
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
