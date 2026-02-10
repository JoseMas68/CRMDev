/**
 * Ticket Validation Schemas
 *
 * Security: All input validation uses Zod to prevent injection attacks
 */

import { z } from "zod";

// Enums matching Prisma schema
export const ticketCategoryEnum = z.enum([
  "BUG",
  "FEATURE_REQUEST",
  "QUESTION",
  "SUPPORT",
  "BILLING",
  "PERFORMANCE",
  "SECURITY",
  "OTHER",
]);

export const ticketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const ticketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"]);

// Create ticket schema (for client portal)
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título es demasiado largo"),

  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(5000, "La descripción es demasiado larga"),

  category: ticketCategoryEnum,

  priority: ticketPriorityEnum.default("MEDIUM"),

  guestName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),

  guestEmail: z
    .string()
    .email("Email inválido")
    .max(255, "El email es demasiado largo"),

  projectId: z.string().cuid("ID de proyecto inválido").optional(),

  attachments: z
    .array(z.string().url("URL de attachment inválida"))
    .max(5, "Máximo 5 attachments")
    .optional()
    .default([]),
});

// Update ticket schema (for dev dashboard)
export const updateTicketSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  category: ticketCategoryEnum.optional(),
  resolution: z.string().max(5000).optional(),
  projectId: z.string().cuid().optional(),
});

// Create ticket comment schema
export const createTicketCommentSchema = z.object({
  content: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(2000, "El comentario es demasiado largo"),

  isInternal: z.boolean().default(false),
});

// Ticket filter schema
export const ticketFilterSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  category: ticketCategoryEnum.optional(),
  projectId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Types
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateTicketCommentInput = z.infer<typeof createTicketCommentSchema>;
export type TicketFilter = z.infer<typeof ticketFilterSchema>;
export type TicketCategory = z.infer<typeof ticketCategoryEnum>;
export type TicketPriority = z.infer<typeof ticketPriorityEnum>;
export type TicketStatus = z.infer<typeof ticketStatusEnum>;
