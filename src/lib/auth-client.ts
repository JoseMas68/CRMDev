/**
 * Better Auth Client Configuration
 *
 * This file exports all client-side auth utilities:
 * - Authentication methods (signIn, signUp, signOut)
 * - Session hooks (useSession)
 * - Organization hooks (useActiveOrganization, useListOrganizations)
 */

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// Create the auth client with organization plugin
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [organizationClient()],
});

// Export individual methods and hooks for convenient imports
export const {
  // Authentication
  signIn,
  signUp,
  signOut,

  // Session
  useSession,
  getSession,

  // Organization
  organization,
  useActiveOrganization,
  useListOrganizations,
} = authClient;

// Type exports
export type AuthClient = typeof authClient;
