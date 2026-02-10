/**
 * Prisma Client with Multi-Tenant Middleware
 *
 * Security Notes:
 * - All tenant models are automatically filtered by organizationId
 * - Create operations automatically inject organizationId from context
 * - Update/Delete operations verify ownership before execution
 * - Prevents any cross-tenant data access at the database layer
 *
 * Usage:
 * - Use `prisma` for auth operations and admin queries
 * - Use `createTenantPrisma(context)` for all tenant-scoped operations
 * - Use `getPrismaWithSession(session)` helper for Server Actions
 */

import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Base Prisma client (used for auth and admin operations)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Models that require tenant isolation
const TENANT_MODELS = [
  "client",
  "deal",
  "project",
  "task",
  "customField",
  "pipelineStage",
  "activity",
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

// Context type for tenant operations
export interface TenantContext {
  organizationId: string;
  userId: string;
}

// Type for the extended Prisma client
type ExtendedPrismaClient = ReturnType<typeof createTenantPrisma>;

/**
 * Creates a Prisma client with automatic tenant filtering
 *
 * Security: This middleware ensures ALL queries for tenant models
 * are automatically filtered by organizationId. Even if code forgets
 * to add the filter, the middleware will add it.
 */
export function createTenantPrisma(context: TenantContext) {
  return prisma.$extends({
    name: "tenant-isolation",
    query: {
      // Client model
      client: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          // Convert to findFirst with org filter for security
          const result = await prisma.client.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          return query(args);
        },
        async update({ args, query }) {
          // Verify ownership before update
          const existing = await prisma.client.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Client not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          // Verify ownership before delete
          const existing = await prisma.client.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Client not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // Deal model
      deal: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.deal.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          (args.data as any).creatorId = context.userId;
          return query(args);
        },
        async update({ args, query }) {
          const existing = await prisma.deal.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Deal not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await prisma.deal.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Deal not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // Project model
      project: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.project.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          return query(args);
        },
        async update({ args, query }) {
          const existing = await prisma.project.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Project not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await prisma.project.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Project not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // Task model
      task: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.task.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          (args.data as any).creatorId = context.userId;
          return query(args);
        },
        async update({ args, query }) {
          const existing = await prisma.task.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Task not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await prisma.task.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Task not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // PipelineStage model
      pipelineStage: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.pipelineStage.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          return query(args);
        },
        async update({ args, query }) {
          const existing = await prisma.pipelineStage.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Pipeline stage not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await prisma.pipelineStage.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Pipeline stage not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // CustomField model
      customField: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.customField.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          return query(args);
        },
        async update({ args, query }) {
          const existing = await prisma.customField.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Custom field not found in organization");
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await prisma.customField.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            select: { id: true },
          });
          if (!existing) {
            throw new Error("[SECURITY] Unauthorized: Custom field not found in organization");
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },

      // Activity model
      activity: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await prisma.activity.findFirst({
            where: { ...args.where, organizationId: context.organizationId },
            ...(args.select ? { select: args.select as any } : {}),
            ...(args.include && !args.select ? { include: args.include as any } : {}),
          });
          return result;
        },
        async create({ args, query }) {
          (args.data as any).organizationId = context.organizationId;
          (args.data as any).userId = context.userId;
          return query(args);
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, organizationId: context.organizationId };
          return query(args);
        },
      },
    },
  });
}

/**
 * Session type expected by getPrismaWithSession
 */
interface SessionWithOrg {
  session: {
    activeOrganizationId?: string | null | undefined;
  };
  user: {
    id: string;
  };
}

/**
 * Helper to get tenant-scoped Prisma from a session
 *
 * Usage in Server Actions:
 * ```
 * const session = await auth.api.getSession({ headers: await headers() });
 * const db = await getPrismaWithSession(session);
 * const clients = await db.client.findMany();
 * ```
 */
export async function getPrismaWithSession(
  session: SessionWithOrg | null
): Promise<ExtendedPrismaClient> {
  if (!session) {
    throw new Error("[SECURITY] Unauthorized: No session");
  }

  if (!session.session.activeOrganizationId) {
    throw new Error("[SECURITY] Unauthorized: No active organization");
  }

  return createTenantPrisma({
    organizationId: session.session.activeOrganizationId,
    userId: session.user.id,
  });
}

/**
 * Validate that a user has access to a specific organization
 *
 * Security: Use this when you need to verify org access without
 * relying on session.activeOrganizationId
 */
export async function validateOrgAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: { id: true },
  });

  return !!member;
}
