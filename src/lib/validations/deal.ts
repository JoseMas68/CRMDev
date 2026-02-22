/**
 * Deal Validation Schemas
 *
 * Security: All input validation uses Zod to prevent injection attacks
 * and ensure data integrity before database operations.
 */

import { z } from "zod";

// Status enum matching Prisma schema
export const dealStatusEnum = z.enum(["OPEN", "WON", "LOST"]);

// Create deal schema
export const createDealSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),

  value: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(val) ? 0 : val),
    z
      .number()
      .nonnegative("Value must be positive")
      .max(999999999999, "Value is too large")
      .default(0)
  ),

  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .default("USD"),

  stageId: z.string().cuid("Invalid stage ID"),

  clientId: z.string().cuid("Invalid client ID").optional().nullable(),

  expectedCloseDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  ),

  notes: z
    .string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  customData: z.record(z.unknown()).optional(),
});

// Update deal schema
export const updateDealSchema = createDealSchema.partial().extend({
  status: dealStatusEnum.optional(),
  lostReason: z
    .string()
    .max(500, "Lost reason must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  order: z.number().int().nonnegative().optional(),
  closedAt: z.coerce.date().optional().nullable(),
});

// Move deal schema (for Kanban drag & drop)
export const moveDealSchema = z.object({
  id: z.string().cuid("Invalid deal ID"),
  stageId: z.string().cuid("Invalid stage ID"),
  order: z.number().int().nonnegative(),
});

// Deal ID validation
export const dealIdSchema = z.object({
  id: z.string().cuid("Invalid deal ID"),
});

// Types
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealInput = z.infer<typeof moveDealSchema>;
export type DealStatus = z.infer<typeof dealStatusEnum>;

// Deal filter schema
export const dealFilterSchema = z.object({
  status: dealStatusEnum.optional(),
  stageId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(["title", "value", "createdAt", "expectedCloseDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type DealFilter = z.infer<typeof dealFilterSchema>;

// Pipeline stage schema
export const createPipelineStageSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#6366f1"),
  order: z.number().int().nonnegative(),
  probability: z.number().int().min(0).max(100).default(0),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial();

export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;
