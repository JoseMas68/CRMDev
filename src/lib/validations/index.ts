/**
 * Centralized exports for all validation schemas
 */

export * from "./client";
export * from "./deal";
export * from "./project";
export * from "./task";

// Common validation helpers
import { z } from "zod";

/**
 * Validate that a string is a valid CUID
 */
export const cuidSchema = z.string().cuid();

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Sort schema
 */
export const sortSchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SortInput = z.infer<typeof sortSchema>;

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Search schema
 */
export const searchSchema = z.object({
  q: z.string().max(255).optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
