/**
 * Better Auth Server Configuration - CRMDev
 *
 * Security Notes:
 * - Uses cookie-based sessions with HttpOnly, Secure, SameSite=Lax
 * - Cookie cache enabled with JWT strategy for fast validation
 * - Organization plugin for multi-tenancy
 * - GitHub OAuth for verified developer badges
 * - Rate limiting enabled to prevent brute force attacks
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  // Disable telemetry for Edge Runtime compatibility
  telemetry: { enabled: false },

  // Database adapter
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Application name (used in emails, etc.)
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CRMDev",

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL,

  // Secret for signing tokens/cookies
  secret: process.env.BETTER_AUTH_SECRET,

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Enable email verification with Resend
    autoSignIn: true, // Auto sign in after registration
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Send verification email using Resend
    sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
      const { sendEmail } = await import("./email");
      const { default: VerificationEmail } = await import("../emails/verification-email");
      await sendEmail({
        to: user.email,
        subject: "Verifica tu email en CRMDev",
        react: VerificationEmail({
          userName: user.name || user.email,
          verificationUrl: url,
        }),
      });
    },
    // Send password reset email using Resend
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      const { sendEmail } = await import("./email");
      const { default: PasswordResetEmail } = await import("../emails/password-reset-email");
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña en CRMDev",
        react: PasswordResetEmail({
          userName: user.name || user.email,
          resetUrl: url,
        }),
      });
    },
  },

  // GitHub OAuth (CRMDev - for verified developer badges)
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      scope: ["user:email", "read:user", "repo"],
    },
  },

  // Account linking (allow linking GitHub to existing email accounts)
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache for fast validation
    },
  },

  // Cookie configuration (security)
  cookies: {
    sessionToken: {
      name: "crmdev.session",
      options: {
        httpOnly: true,
        sameSite: "lax", // For OAuth compatibility
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Callbacks for GitHub data sync
  user: {
    additionalFields: {
      githubId: { type: "string", required: false },
      githubUsername: { type: "string", required: false },
      avatarUrl: { type: "string", required: false },
      isVerifiedDev: { type: "boolean", required: false, defaultValue: false },
    },
  },

  // Plugins
  plugins: [
    organization({
      // Allow users to create organizations
      allowUserToCreateOrganization: true,

      // Limit organizations per user (can be increased with paid plans)
      organizationLimit: 5,

      // Creator becomes owner
      creatorRole: "owner",

      // Member limit per org (can be increased with paid plans)
      membershipLimit: 10,

      // Invitation configuration
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days

      // Send invitation email using Resend
      sendInvitationEmail: async (data) => {
        const { sendOrganizationInvitationEmail } = await import("./email");
        await sendOrganizationInvitationEmail({
          email: data.email,
          inviterName: data.inviter.user.name || data.inviter.user.email,
          organizationName: data.organization.name,
          invitationId: data.id,
        });
      },
    }),
  ],

  // Database hooks for GitHub data sync
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // This runs after user creation
          // GitHub data will be synced via account linking
          console.log(`[CRMDev] User created: ${user.email}`);
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          // Sync GitHub data when account is linked
          if (account.providerId === "github") {
            try {
              await prisma.user.update({
                where: { id: account.userId },
                data: {
                  githubId: account.accountId,
                  isVerifiedDev: true,
                  // avatarUrl and githubUsername will be set from profile data
                },
              });
              console.log(`[CRMDev] GitHub account linked for user: ${account.userId}`);
            } catch (error) {
              console.error("[CRMDev] Failed to sync GitHub data:", error);
            }
          }
        },
      },
    },
  },

  // Rate limiting (basic protection)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 100, // 100 requests per window
  },

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_APP_URL!,
  ].filter(Boolean),

  // Advanced options
  advanced: {
    // Use secure cookies
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

// Export types for use throughout the app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// Extended session type with organization plugin fields
export interface ExtendedSession {
  user: User & {
    id: string;
    githubId?: string | null;
    githubUsername?: string | null;
    avatarUrl?: string | null;
    isVerifiedDev?: boolean;
  };
  session: Session["session"] & {
    activeOrganizationId: string | null;
  };
}

// Helper to get session with proper typing
export async function getAuthSession(requestHeaders: Headers): Promise<ExtendedSession | null> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  return session as ExtendedSession | null;
}
