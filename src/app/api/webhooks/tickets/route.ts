import { NextRequest, NextResponse } from "next/server";
import { TicketCategory, TicketPriority } from "@prisma/client";
import crypto from "crypto";

import { checkRateLimit } from "@/lib/rate-limit";
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

/**
 * Verify ticket webhook signature using HMAC-SHA256
 * Expects signature format: sha256=<hex>
 * Uses timing-safe comparison to prevent timing attacks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  // Require both signature and secret
  if (!signature || !secret) {
    return false;
  }

  // Validate signature format
  if (!signature.startsWith("sha256=")) {
    return false;
  }

  try {
    // Compute expected signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedDigest = `sha256=${hmac.digest("hex")}`;

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature.slice(7)); // Remove "sha256="
    const expectedBuffer = Buffer.from(expectedDigest.slice(7));

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting by IP first (before any processing)
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(
      `ticket-webhook:${ip}`,
      10,  // 10 requests
      "60 s" as const  // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    // 2. Get raw body BEFORE parsing (needed for signature verification)
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    // 3. Parse body after reading raw
    let body: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = JSON.parse(rawBody);
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = new URLSearchParams(rawBody);
      body = Object.fromEntries(formData.entries());
      // Handle attachments
      if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const attachmentEntries = form.getAll("attachments");
        if (attachmentEntries.length) {
          body.attachments = attachmentEntries;
        }
      }
    } else {
      body = JSON.parse(rawBody);
    }

    const {
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

    // 4. Validate required fields (removed secret from required fields)
    if (!projectId || !subject || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 5. Get project and secret
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
    const projectSecret = (customData.ticketWebhookSecret as string | undefined)
      ?? process.env.TICKET_WEBHOOK_SECRET;

    // 6. Require secret to be configured (no null bypass)
    if (!projectSecret) {
      console.error("[TICKET_WEBHOOK] No secret configured for project:", projectId);
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // 7. Verify HMAC-SHA256 signature
    if (!verifyWebhookSignature(rawBody, signature, projectSecret)) {
      console.error("[TICKET_WEBHOOK] Invalid signature from IP:", ip);
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
