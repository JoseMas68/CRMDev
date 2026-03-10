import { NextRequest, NextResponse } from "next/server";
import { TicketCategory, TicketPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface TicketWebhookPayload {
  secret?: string;
  projectId?: string;
  subject?: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  priority?: string;
  category?: string;
  attachments?: unknown;
  clientId?: string;
}

function normalizePriority(value?: string | null): TicketPriority {
  switch ((value || "").toUpperCase()) {
    case "LOW":
      return "LOW";
    case "HIGH":
      return "HIGH";
    case "URGENT":
    case "CRITICAL":
      return "URGENT";
    default:
      return "MEDIUM";
  }
}

function normalizeCategory(value?: string | null): TicketCategory {
  switch ((value || "").toUpperCase()) {
    case "BUG":
    case "ISSUE":
      return "BUG";
    case "FEATURE":
    case "FEATURE_REQUEST":
      return "FEATURE_REQUEST";
    case "QUESTION":
      return "QUESTION";
    case "SUPPORT":
    case "HELP":
      return "SUPPORT";
    case "BILLING":
      return "BILLING";
    case "PERFORMANCE":
      return "PERFORMANCE";
    case "SECURITY":
      return "SECURITY";
    default:
      return "OTHER";
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      body = (await req.json()) ?? {};
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
      const attachmentEntries = form.getAll("attachments");
      if (attachmentEntries.length) {
        body.attachments = attachmentEntries;
      }
    } else {
      // fallback attempt to parse as json
      body = (await req.json().catch(() => ({}))) ?? {};
    }

    const {
      secret,
      projectId,
      subject,
      description,
      contactName,
      contactEmail,
      priority,
      category,
      attachments,
      clientId,
    } = body as TicketWebhookPayload;

    if (!secret || !projectId || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        customData: true,
        clientId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const customData = (project.customData as Record<string, unknown> | null) ?? {};
    const projectSecret = (customData.ticketWebhookSecret as string | undefined) ?? process.env.TICKET_WEBHOOK_SECRET;

    if (!projectSecret || projectSecret !== secret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        organizationId: project.organizationId,
        clientId: clientId || project.clientId,
        projectId: project.id,
        guestName: contactName?.trim() || "Webhook",
        guestEmail: contactEmail?.trim() || "no-reply@crmdev.tech",
        title: subject.trim(),
        description,
        category: normalizeCategory(category),
        priority: normalizePriority(priority),
        status: "OPEN",
        attachments: Array.isArray(attachments)
          ? attachments.filter((link: unknown) => typeof link === "string")
          : [],
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(
      { success: true, data: ticket },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TICKET_WEBHOOK]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
