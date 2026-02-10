/**
 * AI Service for Ticket Triage and Auto-Reply
 * Uses OpenAI GPT-4o to analyze tickets
 */

interface TicketAnalysis {
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  summary: string;
  suggestedFix: string;
  confidence: number;
}

interface AutoReplyInput {
  ticketTitle: string;
  ticketDescription: string;
  category: string;
  priority: string;
  guestName: string;
  guestEmail: string;
  projectName?: string;
}

/**
 * Analyze ticket using AI to determine category, priority, and suggest fix
 */
export async function analyzeTicketWithAI(params: {
  title: string;
  description: string;
  guestName: string;
  guestEmail: string;
  projectName?: string;
}): Promise<ActionResponse<TicketAnalysis>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[AI] OpenAI API key not configured, using default values");
    // Return default analysis when API key is not configured
    return {
      success: true,
      data: {
        category: "SUPPORT",
        priority: "MEDIUM",
        summary: params.title,
        suggestedFix: "Revisar el ticket y contactar al cliente para más detalles.",
        confidence: 0,
      },
    };
  }

  try {
    const prompt = `You are a technical support assistant for a software development agency. Analyze this support ticket and provide:

1. Category: ${["BUG", "FEATURE_REQUEST", "QUESTION", "SUPPORT", "BILLING", "PERFORMANCE", "SECURITY", "OTHER"].join(", ")}
2. Priority: one of LOW, MEDIUM, HIGH, URGENT
3. Summary: A brief 1-2 sentence summary
4. Suggested Fix: A technical explanation or solution approach

Ticket Details:
- Title: ${params.title}
- Description: ${params.description}
- From: ${params.guestName} (${params.guestEmail})
${params.projectName ? `- Project: ${params.projectName}` : ""}

Respond in JSON format:
{
  "category": "CATEGORY",
  "priority": "PRIORITY",
  "summary": "summary",
  "suggestedFix": "technical explanation",
  "confidence": 0.0-1.0
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a technical support specialist. Analyze tickets and provide structured JSON responses.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[AI] OpenAI API error:", error);
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return {
      success: true,
      data: {
        category: content.category.toUpperCase(),
        priority: content.priority.toUpperCase(),
        summary: content.summary,
        suggestedFix: content.suggestedFix,
        confidence: content.confidence || 0.8,
      },
    };
  } catch (error) {
    console.error("[AI] Error analyzing ticket:", error);
    // Return fallback analysis
    return {
      success: true,
      data: {
        category: "SUPPORT",
        priority: "MEDIUM",
        summary: params.title,
        suggestedFix: "Revisar el ticket y contactar al cliente para más detalles.",
        confidence: 0,
      },
    };
  }
}

/**
 * Generate auto-reply for client using AI
 */
export async function generateAutoReply(params: AutoReplyInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return default reply when API key is not configured
    return `Hola ${params.guestName},\n\nGracias por contactarnos. Hemos recibido tu ticket "${params.ticketTitle}" y lo hemos registrado en nuestro sistema con categoría ${params.category} y prioridad ${params.priority}.\n\nNuestro equipo revisará tu solicitud a la brevedad y te contactaremos en caso de necesitar más información.\n\nSaludos,\nEl equipo de soporte`;
  }

  try {
    const prompt = `Generate a friendly, professional auto-reply email in Spanish for a client support ticket.

Ticket Details:
- Title: ${params.ticketTitle}
- Description: ${params.ticketDescription}
- Category: ${params.category}
- Priority: ${params.priority}
- Client Name: ${params.guestName}
${params.projectName ? `- Project: ${params.projectName}` : ""}

The reply should:
1. Be warm and professional
2. Acknowledge receipt of the ticket
3. Mention the category and priority
4. Set expectations (we'll review it soon)
5. Be concise (2-3 paragraphs max)

Write ONLY the email body, no subject line.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a bilingual customer support representative. Write professional, friendly responses in Spanish.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("[AI] OpenAI API error for auto-reply");
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("[AI] Error generating auto-reply:", error);
    // Return fallback reply
    return `Hola ${params.guestName},\n\nGracias por contactarnos. Hemos recibido tu ticket "${params.ticketTitle}" y lo hemos registrado en nuestro sistema con categoría ${params.category} y prioridad ${params.priority}.\n\nNuestro equipo revisará tu solicitud a la brevedad y te contactaremos en caso de necesitar más información.\n\nSaludos,\nEl equipo de soporte`;
  }
}

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
