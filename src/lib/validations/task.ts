/**
 * Task Validation Schemas
 *
 * Security: All input validation uses Zod to prevent injection attacks
 * and ensure data integrity before database operations.
 */

import { z } from "zod";

// Status enum matching Prisma schema
export const taskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]);

// Priority enum matching Prisma schema
export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// Create task schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),

  description: z
    .string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .or(z.literal(""))
    .nullable(),

  status: taskStatusEnum.default("TODO"),

  priority: taskPriorityEnum.default("MEDIUM"),

  dueDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional().nullable()
  ),

  estimatedHours: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(val) ? undefined : val),
    z
      .number()
      .nonnegative("Estimated hours must be positive")
      .max(9999, "Estimated hours is too large")
      .optional()
      .nullable()
  ),

  projectId: z.string().cuid("Invalid project ID").nullish(),

  assigneeId: z.string().cuid("Invalid assignee ID").nullish(),

  parentId: z.string().cuid("Invalid parent task ID").nullish(),

  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags allowed").optional(),

  // GitHub Integration fields (CRMDev)
  issueUrl: z
    .string()
    .url("Invalid issue URL")
    .max(500, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  prUrl: z
    .string()
    .url("Invalid PR URL")
    .max(500, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  labels: z
    .array(z.enum(["bug", "feature", "enhancement", "documentation", "refactor", "hotfix"]))
    .max(5, "Maximum 5 labels")
    .optional()
    .default([]),

  commitHash: z
    .string()
    .regex(/^[a-f0-9]{7,40}$/, "Invalid commit hash")
    .optional()
    .nullable()
    .or(z.literal("")),

  customData: z.record(z.unknown()).optional(),
});

// Update task schema
export const updateTaskSchema = createTaskSchema.partial().extend({
  actualHours: z
    .number()
    .nonnegative("Actual hours must be positive")
    .max(9999, "Actual hours is too large")
    .optional()
    .nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  order: z.number().int().nonnegative().optional(),
});

// Move task schema (for drag & drop)
export const moveTaskSchema = z.object({
  id: z.string().cuid("Invalid task ID"),
  status: taskStatusEnum,
  order: z.number().int().nonnegative(),
});

// Bulk update tasks schema
export const bulkUpdateTasksSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one task ID required"),
  data: updateTaskSchema,
});

// Task ID validation
export const taskIdSchema = z.object({
  id: z.string().cuid("Invalid task ID"),
});

// Types
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

// Task filter schema
export const taskFilterSchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  projectId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  hasDueDate: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  completed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z
    .enum(["title", "createdAt", "dueDate", "priority", "status", "order"])
    .default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type TaskFilter = z.infer<typeof taskFilterSchema>;
