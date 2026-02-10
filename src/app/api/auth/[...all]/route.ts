/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all authentication endpoints:
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - All organization endpoints
 * - etc.
 *
 * Security Notes:
 * - Better Auth handles all security measures internally
 * - CSRF protection is enabled
 * - Rate limiting is configured in auth.ts
 * - Cookies are HttpOnly, Secure, SameSite
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
