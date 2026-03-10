/**
 * Rate Limiting Configuration
 *
 * Provides rate limiting for API endpoints using Upstash Redis
 * Falls back to in-memory rate limiting for development
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Duration } from "@upstash/ratelimit";

// Environment check
const hasUpstashConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client if configured
let redis: Redis | undefined;
if (hasUpstashConfig) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// In-memory fallback for development
const inMemoryStore = new Map<string, { count: number; timestamp: number }>();

/**
 * Clean up old entries from in-memory store
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  for (const [key, value] of inMemoryStore.entries()) {
    if (now - value.timestamp > windowMs) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: Duration = "10 s"
): Promise<{ success: boolean; remaining: number }> {
  // Use Upstash if configured
  if (hasUpstashConfig && redis) {
    try {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: false, // Disable analytics to save tokens
      });

      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
      };
    } catch (error) {
      console.error("[RATE_LIMIT] Upstash error, falling back to in-memory:", error);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback for development or if Upstash fails
  cleanupInMemoryStore();

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const record = inMemoryStore.get(identifier);

  if (!record || now - record.timestamp > windowMs) {
    // First request or window expired
    inMemoryStore.set(identifier, { count: 1, timestamp: now });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // MCP REST API: 10 requests per 10 seconds
  mcpRest: { limit: 10, window: "10 s" as Duration },

  // MCP SSE: 5 connections per minute
  mcpSSE: { limit: 5, window: "60 s" as Duration },

  // AI Chat: 20 requests per minute
  aiChat: { limit: 20, window: "60 s" as Duration },

  // Time Entry: 30 requests per minute
  timeEntry: { limit: 30, window: "60 s" as Duration },

  // General API: 60 requests per minute
  general: { limit: 60, window: "60 s" as Duration },
} as const;

/**
 * Get rate limit key for a user/org
 */
export function getRateLimitKey(
  type: string,
  userId?: string,
  organizationId?: string
): string {
  const parts = ["ratelimit", type];

  if (organizationId) parts.push(organizationId);
  else if (userId) parts.push(userId);

  return parts.join(":");
}
