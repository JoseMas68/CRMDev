# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CRMPro is a **multi-tenant SaaS CRM** built with:
- **Next.js 15** (App Router, React Server Components) with **Turbopack** in dev
- **Better Auth** with organization plugin for multi-tenancy
- **Prisma** with PostgreSQL (Neon/Supabase) - shared database with tenant isolation
- **MCP (Model Context Protocol)** for AI agent integrations
- **OpenAI API** for AI Assistant chat functionality
- **Stripe** for subscriptions
- **Resend** for emails

## Development Commands

```bash
# Development server (with Turbopack - default)
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
pnpm db:migrate:deploy # Deploy migrations in production
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

### Multi-User Architecture
**Each user creates their own API Key** in CRMDev → Settings → API Keys, then configures their AI assistant (Claude, ChatGPT, etc.) with that key. The API key determines which organization's data is accessible.

### Endpoints
- **REST Endpoint**: `/api/mcp/rest` - Simple JSON API (recommended for most integrations)
- **SSE Endpoint**: `/api/mcp/sse` - Server-Sent Events (for MCP protocol clients)
- **Authentication**: Bearer token from `api_keys` table (per-organization)

### Registered Tools ([src/lib/mcp.ts](src/lib/mcp.ts))
- **Projects**: list, create, update, delete
- **Tasks**: list, create, update, delete
- **Clients**: list, create, update, delete
- **Time**: get_project_time_report
- **Members**: list (for AI agent to see available assignees)

### User Setup
Users configure their own AI assistant:
- See [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md) for Claude Desktop instructions
- Each user sets their own `CRM_API_KEY` in their config
- For REST API: POST to `/api/mcp/rest` with `Authorization: Bearer crm_KEY`

## AI Assistant (OpenAI Integration)

### Chat Endpoint ([src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts))
- **OpenAI API** integration for chat functionality
- Available at `/api/ai/chat` (Server Action)
- **Tools available to AI**:
  - `list_members`: List organization members for task assignment
  - `list_tasks`: View tasks with assignee and due date info
  - `create_task`: Create tasks with optional assigneeId
  - `list_projects`, `create_project`, etc.
- **Context-aware**: AI knows which user is making the request
- **Assignment capable**: AI can assign tasks to specific members

## UI Component Patterns

### Select Component Best Practices
**CRITICAL**: Radix UI Select components **cannot have empty string values** in SelectItem. Use `"none"` or `"all"` instead.

```typescript
// ❌ WRONG - Will throw error
<SelectItem value="">Sin proyecto</SelectItem>

// ✅ CORRECT - Use special value
<SelectItem value="none">Sin proyecto</SelectItem>

// When processing:
if (editProjectId && editProjectId !== "none") {
  updateData.projectId = editProjectId;
} else {
  updateData.projectId = null;
}
```

### Mobile-First Responsive Patterns
- **Hide on mobile**: `hidden sm:block` or `lg:hidden`
- **Full width on mobile**: `w-full sm:w-[200px]`
- **Flexible containers**: `flex-1 sm:flex-none`
- **Dialogs**: Use `w-[95vw]` for mobile-friendly width

### Common Responsive Classes
```typescript
// Stats panels - desktop only
<div className="hidden sm:block">
  <TaskStats stats={stats} />
</div>

// Mobile-only buttons
<Button className="lg:hidden">
  <Edit2 className="h-4 w-4" />
</Button>

// Responsive width inputs
<Input className="w-full sm:w-auto" />
```

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

# OpenAI (for AI Assistant)
OPENAI_API_KEY="sk-..."

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
| [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts) | OpenAI chat endpoint |
| [src/middleware.ts](src/middleware.ts) | Route protection |
| [src/app/api/mcp/sse/route.ts](src/app/api/mcp/sse/route.ts) | SSE endpoint for MCP |
| [src/app/api/mcp/message/route.ts](src/app/api/mcp/message/route.ts) | MCP message handler |
| [prisma/schema.prisma](prisma/schema.prisma) | Database schema |
| [next.config.ts](next.config.ts) | Next.js config with standalone output |

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

### Mobile-Responsive Task Editing
Tasks support full editing on mobile devices:
- Edit button appears on mobile only (`lg:hidden`)
- All fields editable: title, description, priority, status, project, assignee, due date
- Select components use special values (`"none"`) instead of empty strings
- Dialog is mobile-responsive with `w-[95vw]` width

## Deployment Notes

- **Output**: Standalone (for Docker/EasyPanel) - configured in next.config.ts
- **Database**: PostgreSQL with connection pooling (Prisma Accelerate recommended)
- **Webhooks**: Stripe, GitHub (for task syncing)
- **Cron**: `/api/cron/wp-monitor` for WordPress monitoring
- Next.js 15 uses Turbopack by default in dev (`pnpm dev`)

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

### Select component errors?
- **"A <Select.Item /> must have a value prop that is not an empty string"**
- Solution: Use `"none"`, `"all"`, or any non-empty string instead of `""`
- Handle the special value in your change handlers

### TypeScript errors with null checks?
- Always add null checks at function level, not just component level
- Example:
  ```typescript
  function handleEdit() {
    if (!task) return;  // Add this
    setEditTitle(task.title);
  }
  ```

## Recent Features (2026)

### AI Assistant Improvements
- AI can now list members and assign tasks to specific users
- Task creation supports `assigneeId` parameter
- Better context awareness for task management

### Mobile Enhancements
- Full task editing capability on mobile devices
- Member filter with responsive width (full on mobile, fixed on desktop)
- Hidden stats panels on mobile to save space
- Improved button positioning to avoid overlap

### UI Fixes
- Select components no longer use empty string values
- Better mobile dialog widths
- Improved button positioning in dialogs
