/**
 * Project Validation Schemas
 *
 * Security: All input validation uses Zod to prevent injection attacks
 * and ensure data integrity before database operations.
 */

import { z } from "zod";

// Status enum matching Prisma schema
export const projectStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

// Type enum matching Prisma schema
export const projectTypeEnum = z.enum([
  "GITHUB",
  "WORDPRESS",
  "VERCEL",
  "OTHER",
]);

// Create project schema
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters")
    .trim(),

  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  type: projectTypeEnum.default("OTHER"),

  status: projectStatusEnum.default("NOT_STARTED"),

  startDate: z.coerce.date().optional().nullable(),

  deadline: z.coerce.date().optional().nullable(),

  budget: z
    .number()
    .nonnegative("Budget must be positive")
    .max(999999999999, "Budget is too large")
    .optional()
    .nullable(),

  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .default("USD"),

  clientId: z.string().cuid("Invalid client ID").optional().nullable(),

  // Developer fields (CRMDev)
  repoUrl: z
    .string()
    .url("Invalid repository URL")
    .max(500, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  wpUrl: z
    .string()
    .url("Invalid WordPress URL")
    .max(500, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  vercelUrl: z
    .string()
    .url("Invalid Vercel URL")
    .max(500, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  techStack: z
    .array(z.string().max(50, "Tech stack item too long"))
    .max(20, "Maximum 20 tech stack items")
    .optional()
    .default([]),

  labels: z
    .array(z.string().max(50, "Label too long"))
    .max(10, "Maximum 10 labels")
    .optional()
    .default([]),

  customData: z.record(z.unknown()).optional(),
});

// Update project schema
export const updateProjectSchema = createProjectSchema.partial().extend({
  progress: z.number().int().min(0).max(100).optional(),
  spent: z.number().nonnegative().optional(),
  completedAt: z.coerce.date().optional().nullable(),
});

// Project ID validation
export const projectIdSchema = z.object({
  id: z.string().cuid("Invalid project ID"),
});

// Types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusEnum>;
export type ProjectType = z.infer<typeof projectTypeEnum>;

// Project filter schema
export const projectFilterSchema = z.object({
  type: projectTypeEnum.optional(),
  status: projectStatusEnum.optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  hasDeadline: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "deadline", "progress", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProjectFilter = z.infer<typeof projectFilterSchema>;
