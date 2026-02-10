/**
 * Client Validation Schemas
 *
 * Security: All input validation uses Zod to prevent injection attacks
 * and ensure data integrity before database operations.
 */

import { z } from "zod";

// Status enum matching Prisma schema
export const clientStatusEnum = z.enum([
  "LEAD",
  "PROSPECT",
  "CUSTOMER",
  "INACTIVE",
  "CHURNED",
]);

// Create client schema
export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters")
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .max(50, "Phone must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  company: z
    .string()
    .max(255, "Company must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  position: z
    .string()
    .max(255, "Position must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .url("Invalid URL")
    .max(500, "Website must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  state: z
    .string()
    .max(100, "State must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  postalCode: z
    .string()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  status: clientStatusEnum.default("LEAD"),

  source: z
    .string()
    .max(100, "Source must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  tags: z.array(z.string().max(50)).max(20, "Maximum 20 tags allowed").optional(),

  notes: z
    .string()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .or(z.literal("")),

  customData: z.record(z.unknown()).optional(),
});

// Update client schema (all fields optional except for validation)
export const updateClientSchema = createClientSchema.partial();

// Client ID validation
export const clientIdSchema = z.object({
  id: z.string().cuid("Invalid client ID"),
});

// Types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientStatus = z.infer<typeof clientStatusEnum>;

// Client filter schema (for querying)
export const clientFilterSchema = z.object({
  status: clientStatusEnum.optional(),
  search: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["name", "email", "createdAt", "updatedAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ClientFilter = z.infer<typeof clientFilterSchema>;
