# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CRMPro is a **multi-tenant SaaS CRM** built with:
- **Next.js 15** (App Router, React Server Components)
- **Better Auth** with organization plugin for multi-tenancy
- **Prisma** with PostgreSQL (Neon/Supabase) - shared database with tenant isolation
- **MCP (Model Context Protocol)** for AI agent integrations
- **Stripe** for subscriptions
- **Resend** for emails

## Development Commands

```bash
# Development server (with Turbopack)
pnpm dev

# Build for production
pnpm build

# Production server (after build)
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Database operations
pnpm db:push          # Push schema changes to DB (dev)
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Create migration
pnpm db:setup         # Generate + push in one command
pnpm db:cleanup-users # Clean up users script

# After installing dependencies
pnpm postinstall      # Runs prisma generate automatically
```

## Architecture: Multi-Tenant Isolation

### Security Layers (Bottom to Top)

1. **Prisma Middleware** ([src/lib/prisma.ts](src/lib/prisma.ts))
   - All tenant models (Client, Deal, Project, Task, CustomField, PipelineStage, Activity) are **automatically filtered** by `organizationId`
   - Create operations auto-inject `organizationId` from context
   - Update/Delete operations verify ownership before executing

2. **Server Actions** ([src/actions/](src/actions/))
   - Always validate session with `auth.api.getSession({ headers })`
   - Check for `activeOrganizationId` in session
   - Use `getPrismaWithSession(session)` to get tenant-scoped Prisma client
   - Validate input with Zod schemas from [src/lib/validations/](src/lib/validations/)

3. **Middleware** ([src/middleware.ts](src/middleware.ts))
   - Checks for session cookie existence (not full validation to avoid Edge Runtime issues)
   - Redirects unauthenticated users to `/login`
   - Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/api/auth`, `/api/webhooks`, `/accept-invitation`

### Server Action Pattern

```typescript
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getPrismaWithSession } from "@/lib/prisma";

export async function createClient(data: CreateClientInput) {
  // 1. Validate session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Get tenant-scoped Prisma (auto-filters by org)
  const db = await getPrismaWithSession(session);

  // 3. Execute operation (organizationId injected automatically)
  const client = await db.client.create({ data });

  // 4. Revalidate cache
  revalidatePath("/clients");

  return { success: true, data: client };
}
```

## Better Auth Configuration

### Server Config ([src/lib/auth.ts](src/lib/auth.ts))
- Cookie name: `crmdev.session`
- Session expires: 7 days
- Cookie cache: 5 minutes (JWT strategy)
- Email verification required in production only
- GitHub OAuth for verified developer badges
- Organization plugin with roles: owner, admin, member

### Client Config ([src/lib/auth-client.ts](src/lib/auth-client.ts))
```typescript
import { authClient } from "@/lib/auth-client";
// Use hooks: useSession(), useActiveOrganization(), useListOrganizations()
```

### Organization Switching
- Session contains `activeOrganizationId`
- User can be member of multiple organizations (max 5 in free tier)
- Each organization is a separate tenant with isolated data

## MCP (Model Context Protocol) Integration

### Architecture
- **SSE Endpoint**: `/api/mcp/sse` - Server-Sent Events for streaming
- **Message Endpoint**: `/api/mcp/message` - POST handler for JSON-RPC messages
- **API Key Authentication**: Bearer token from `api_keys` table

### Server ([src/lib/mcp.ts](src/lib/mcp.ts))
Registered tools:
- `list_projects` - List projects in active organization
- `get_project_time_report` - Get time tracking report for project

### Bridge Script ([mcp-bridge.js](mcp-bridge.js))
- Connects Claude Desktop to remote CRM via SSE
- Uses environment variables: `CRM_URL`, `CRM_API_KEY`
- Note: Native SSE support in Claude Desktop is pending

## Database Schema Notes

### Core Multi-Tenant Models
All include `organizationId` for tenant isolation:
- **Client** - Leads and customers with custom fields
- **Deal** - Pipeline opportunities with drag & drop order
- **Project** - Projects with tasks, time tracking, progress
- **Task** - Tasks with assignees, priorities, statuses
- **PipelineStage** - Customizable pipeline stages per organization
- **Activity** - Audit log for all entities

### Developer Features (CRMDev)
- **ProjectMember** - Project-level access control
- **WpMonitor** - WordPress site monitoring (updates, vulnerabilities, SSL)
- **Ticket** - Client support tickets with AI categorization
- **TimeEntry** - Time tracking per task
- **ApiKey** - MCP integration keys per organization

### Enums
- `ClientStatus`: LEAD, PROSPECT, CUSTOMER, INACTIVE, CHURNED
- `DealStatus`: OPEN, WON, LOST
- `ProjectStatus`: NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
- `ProjectType`: GITHUB, WORDPRESS, VERCEL, OTHER
- `TaskStatus`: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED
- `TaskPriority`: LOW, MEDIUM, HIGH, URGENT

## Environment Variables

Required (see [.env.example](.env.example)):
```bash
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="CRMPro"

# MCP (for external integrations)
NEXT_PUBLIC_MCP_PUBLIC_URL="http://localhost:3000"  # SSE endpoint base URL
# Producción:
# NEXT_PUBLIC_MCP_PUBLIC_URL="https://crmdev.tech"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optional, Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# GitHub OAuth (optional, for verified badges)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Important Files

| File | Purpose |
|------|---------|
| [src/lib/auth.ts](src/lib/auth.ts) | Better Auth server config |
| [src/lib/prisma.ts](src/lib/prisma.ts) | Prisma with tenant middleware |
| [src/lib/mcp.ts](src/lib/mcp.ts) | MCP server + tools registration |
| [src/middleware.ts](src/middleware.ts) | Route protection |
| [src/app/api/mcp/sse/route.ts](src/app/api/mcp/sse/route.ts) | SSE endpoint for MCP |
| [src/app/api/mcp/message/route.ts](src/app/api/mcp/message/route.ts) | MCP message handler |
| [prisma/schema.prisma](prisma/schema.prisma) | Database schema |

## Common Patterns

### Creating a New Server Action
1. Add to appropriate file in [src/actions/](src/actions/)
2. Validate session and activeOrganizationId
3. Use `getPrismaWithSession(session)` for tenant-scoped queries
4. Revalidate paths after mutations
5. Return `{ success: true, data }` or `{ success: false, error }`

### Adding a New MCP Tool
1. Register in [src/lib/mcp.ts](src/lib/mcp.ts) with `server.tool()`
2. Extract `organizationId` from `extra._meta?.organizationId`
3. Use Prisma with organization filter
4. Return `{ content: [{ type: "text", text: JSON.stringify(result) }] }`

### Adding Validation Schema
1. Create in [src/lib/validations/](src/lib/validations/)
2. Use Zod with appropriate types
3. Export both schema and inferred TypeScript type

## Deployment Notes

- **Output**: Standalone (for Docker/EasyPanel)
- **Database**: PostgreSQL with connection pooling (Prisma Accelerate recommended)
- **Webhooks**: Stripe, GitHub (for task syncing)
- **Cron**: `/api/cron/wp-monitor` for WordPress monitoring
- Next.js 15 uses Turbopack by default in dev

## Troubleshooting

### Multi-tenant data leak?
- Verify `getPrismaWithSession()` is used (not raw `prisma`)
- Check that session has `activeOrganizationId`
- Ensure model is in `TENANT_MODELS` array in prisma.ts

### MCP connection issues?
- Verify API key exists in `api_keys` table
- Check `NEXT_PUBLIC_MCP_PUBLIC_URL` includes protocol and port
- SSE endpoint must be accessible from client

### Better Auth session issues?
- Cookie name: `crmdev.session`
- Middleware checks cookie only (not full session)
- Full validation in server components/actions
