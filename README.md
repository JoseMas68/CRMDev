# CRMPro - SaaS Multi-Tenant CRM

![Next.js](https://img.shields.io/badge/Next.js-15.1+-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.2+-2D3748?style=flat-square&logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 📋 Índice

1. [Overview y Objetivos](#overview-y-objetivos)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tech Stack](#tech-stack)
4. [Integración MCP](#integración-mcp)
5. [Requisitos Previos](#requisitos-previos)
6. [Setup Local Paso a Paso](#setup-local-paso-a-paso)
7. [Configuración de Better Auth](#configuración-de-better-auth)
8. [Variables de Entorno](#variables-de-entorno)
9. [Seguridad Multi-Tenant](#seguridad-multi-tenant)
10. [Deployment con EasyPanel](#deployment-con-easypanel)
11. [Guía de Desarrollo](#guía-de-desarrollo)
12. [Documentación Adicional](#documentación-adicional)

---

## Overview y Objetivos

### ¿Qué es CRMPro?

CRMPro es un **CRM SaaS comercial multi-tenant** diseñado para PYMEs y agencias. Permite gestionar el ciclo completo de ventas y proyectos con aislamiento total de datos entre organizaciones (tenants).

### Funcionalidades Core

| Módulo | Descripción |
|--------|-------------|
| **Clientes** | Gestión de leads, contactos y oportunidades con campos personalizables |
| **Pipeline de Ventas** | Tablero Kanban con etapas drag & drop para seguimiento de deals |
| **Proyectos** | Proyectos asociados a clientes con tareas, deadlines, progreso % y comentarios |
| **Tareas** | Sistema de tareas individuales con prioridades, estados y asignaciones |
| **Time Tracking** | Registro de tiempo por tarea con reportes |
| **Tickets** | Sistema de soporte con categorización AI |
| **Multi-Tenancy** | Cada organización es un tenant aislado con sus propios datos |
| **MCP Integration** | API para integración con asistentes AI (Claude, ChatGPT, etc.) |
| **WordPress Monitor** | Monitoreo de updates, vulnerabilidades y SSL |
| **Suscripciones** | Planes de pago por organización via Stripe |

### Objetivos Técnicos

- **Aislamiento estricto**: Ningún dato puede filtrarse entre tenants
- **Performance**: Cookie cache con JWT para validación rápida de sesiones
- **Escalabilidad**: Arquitectura shared-database con índices optimizados
- **Seguridad**: Validación en cada capa (middleware, server actions, DB)
- **DX moderno**: Server Components, Server Actions, TypeScript strict

---

## Arquitectura del Sistema

### Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Cliente (Browser)"
        A[Next.js App Router]
        B[React Server Components]
        C[Client Components]
    end

    subgraph "Servidor (Vercel Edge/Node)"
        D[Middleware Auth]
        E[Server Actions]
        F[Route Handlers]
        G[Better Auth API]
    end

    subgraph "Capa de Datos"
        H[Prisma Client + Tenant Middleware]
        I[(PostgreSQL - Neon/Supabase)]
    end

    subgraph "Servicios Externos"
        J[Stripe Payments]
        K[Email Service]
    end

    A --> D
    D --> B
    B --> E
    C --> E
    E --> H
    F --> G
    G --> H
    H --> I
    F --> J
    E --> K

    style D fill:#ff6b6b,color:#fff
    style H fill:#ff6b6b,color:#fff
```

### Flujo de Autenticación Multi-Tenant

```mermaid
sequenceDiagram
    participant U as Usuario
    participant M as Middleware
    participant BA as Better Auth
    participant PM as Prisma Middleware
    participant DB as PostgreSQL

    U->>M: Request a /dashboard
    M->>BA: Validar session cookie
    BA->>M: Session + activeOrganizationId
    M->>M: ¿Tiene org activa?
    alt No tiene org activa
        M->>U: Redirect a /select-org
    else Tiene org activa
        M->>PM: Query con orgId en context
        PM->>PM: Inyectar WHERE organizationId = ?
        PM->>DB: Query filtrada
        DB->>U: Datos del tenant
    end
```

### Estructura de Base de Datos

```mermaid
erDiagram
    Organization ||--o{ User : "has members"
    Organization ||--o{ Client : "owns"
    Organization ||--o{ Deal : "owns"
    Organization ||--o{ Project : "owns"
    Organization ||--o{ Task : "owns"
    Organization ||--o{ Subscription : "has"

    Client ||--o{ Deal : "has"
    Client ||--o{ Project : "has"
    Project ||--o{ Task : "contains"

    User ||--o{ Task : "assigned"
    User ||--o{ Deal : "owns"

    Organization {
        string id PK
        string name
        string slug
        datetime createdAt
    }

    User {
        string id PK
        string email
        string name
        string organizationId FK
        string role
    }

    Client {
        string id PK
        string organizationId FK
        string name
        string email
        string phone
        json customFields
        string status
    }

    Deal {
        string id PK
        string organizationId FK
        string clientId FK
        string title
        decimal value
        string stage
        int order
    }

    Project {
        string id PK
        string organizationId FK
        string clientId FK
        string name
        int progress
        string status
        datetime deadline
    }

    Task {
        string id PK
        string organizationId FK
        string projectId FK
        string assigneeId FK
        string title
        string priority
        string status
    }
```

---

## Tech Stack

### Core Framework

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.1+ | Framework full-stack con App Router |
| **React** | 19+ | UI Library con Server Components |
| **TypeScript** | 5.6+ | Type safety estricto |

### Autenticación y Multi-Tenancy

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Better Auth** | 1.2+ | Auth framework con plugin organization |
| **better-auth/client** | 1.2+ | Client-side auth hooks |

### Base de Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PostgreSQL** | 15+ | Base de datos relacional |
| **Prisma** | 6.2+ | ORM con middleware para tenant isolation |
| **Neon** | - | Serverless PostgreSQL (free tier) |

### UI/UX

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Tailwind CSS** | 3.4+ | Utility-first CSS |
| **Shadcn/UI** | latest | Componentes accesibles y customizables |
| **@dnd-kit** | 6.1+ | Drag & drop para Kanban |
| **Lucide React** | 0.460+ | Iconos |

### Estado y Data Fetching

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **TanStack Query** | 5+ | Server state management |
| **Zustand** | 5+ | Client state (si necesario) |
| **React Hook Form** | 7.54+ | Formularios performantes |
| **Zod** | 3.24+ | Validación de schemas |

### Pagos y Servicios

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Stripe** | 17+ | Suscripciones y pagos |
| **Resend** | 4+ | Emails transaccionales |

### DevOps

| Tecnología | Propósito |
|------------|-----------|
| **Docker** | Contenerización para deployment |
| **EasyPanel** | Hosting y deployment |
| **Prisma Accelerate** | Connection pooling para edge |

---

## Integración MCP

### ¿Qué es MCP?

**MCP (Model Context Protocol)** es una API abierta que permite a asistentes AI (como Claude Desktop, ChatGPT, etc.) interactuar directamente con el CRM.

### Arquitectura Multi-Usuario

Cada usuario crea su propia API Key desde el CRM:
- **Security**: Cada key está vinculada a una organización específica
- **Aislamiento**: Los asistentes solo acceden a datos de la organización del usuario
- **Control**: Los usuarios pueden revocar keys en cualquier momento

### Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `list_projects` | Listar proyectos de la organización |
| `create_project` | Crear nuevo proyecto |
| `update_project` | Actualizar proyecto existente |
| `delete_project` | Eliminar proyecto |
| `list_tasks` | Listar tareas de un proyecto |
| `create_task` | Crear nueva tarea |
| `update_task` | Actualizar tarea existente |
| `delete_task` | Eliminar tarea |
| `list_clients` | Listar clientes |
| `create_client` | Crear nuevo cliente |
| `update_client` | Actualizar cliente |
| `delete_client` | Eliminar cliente |
| `get_project_time_report` | Reporte de tiempo por proyecto |

### Endpoints MCP

- **REST API**: `POST /api/mcp/rest` - JSON API simple
- **SSE Endpoint**: `/api/mcp/sse` - Server-Sent Events para clientes MCP

### Configuración Rápida

1. **Crear API Key**:
   - Ir a Settings → API Keys
   - Crear nueva key con nombre descriptivo
   - Copiar la key generada

2. **Configurar Claude Desktop**:
   ```json
   {
     "mcpServers": {
       "crmdev": {
         "command": "node",
         "args": ["path/to/mcp-client.js"],
         "env": {
           "CRM_API_KEY": "crm_tu_api_key_aqui"
         }
       }
     }
   }
   ```

3. **Usar REST API**:
   ```bash
   curl -X POST https://tu-domain.com/api/mcp/rest \
     -H "Authorization: Bearer crm_tu_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "tool": "list_projects",
       "arguments": {}
     }'
   ```

📖 **Guía completa**: [Ver documentación de MCP](./docs/guides/claude-desktop-setup.md)

---

## Requisitos Previos

### Software Requerido

```bash
# Node.js 20+ (LTS recomendado)
node --version  # debe ser >= 20.0.0

# pnpm (recomendado) o npm
pnpm --version  # >= 9.0.0

# Git
git --version
```

### Cuentas Necesarias

1. **Neon Database** (https://neon.tech)
   - Free tier: 0.5GB storage, 1 proyecto
   - Crear proyecto y obtener connection string

2. **Vercel** (https://vercel.com)
   - Free tier para hobby projects
   - Conectar con GitHub

3. **Stripe** (https://stripe.com)
   - Crear cuenta developer
   - Obtener API keys (test mode)

4. **Resend** (https://resend.com) - Opcional
   - Para emails de invitación/notificaciones

### Conocimientos Recomendados

- Next.js App Router y Server Components
- TypeScript intermedio
- SQL básico y Prisma
- React hooks y patterns

---

## Setup Local Paso a Paso

### Paso 1: Crear Proyecto Next.js

```bash
# Crear proyecto con create-next-app
npx create-next-app@latest crmpro --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Entrar al directorio
cd crmpro
```

### Paso 2: Instalar Dependencias Core

```bash
# Prisma y PostgreSQL
pnpm add prisma @prisma/client
pnpm add -D prisma

# Better Auth
pnpm add better-auth

# UI Components
pnpm add @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
pnpm add @radix-ui/react-avatar @radix-ui/react-label @radix-ui/react-separator
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react

# Shadcn UI (inicializar)
npx shadcn@latest init

# Forms y Validación
pnpm add react-hook-form @hookform/resolvers zod

# Drag & Drop
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Data Fetching
pnpm add @tanstack/react-query

# Pagos
pnpm add stripe @stripe/stripe-js

# Utilidades
pnpm add date-fns nanoid
```

### Paso 3: Instalar Componentes Shadcn

```bash
# Componentes esenciales
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add form
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add progress
```

### Paso 4: Inicializar Prisma

```bash
# Inicializar Prisma con PostgreSQL
npx prisma init --datasource-provider postgresql
```

### Paso 5: Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/crmpro?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="tu-secret-super-seguro-minimo-32-caracteres"
BETTER_AUTH_URL="http://localhost:3000"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Paso 6: Estructura de Carpetas

```
crmpro/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── pipeline/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── select-org/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # Shadcn components
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── org-switcher.tsx
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── stats-cards.tsx
│   │   ├── clients/
│   │   │   ├── client-form.tsx
│   │   │   ├── client-table.tsx
│   │   │   └── client-card.tsx
│   │   ├── pipeline/
│   │   │   ├── kanban-board.tsx
│   │   │   ├── kanban-column.tsx
│   │   │   └── deal-card.tsx
│   │   ├── projects/
│   │   │   ├── project-form.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── task-list.tsx
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── error-boundary.tsx
│   │       └── empty-state.tsx
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server config
│   │   ├── auth-client.ts       # Better Auth client config
│   │   ├── prisma.ts            # Prisma client con middleware
│   │   ├── stripe.ts            # Stripe config
│   │   ├── utils.ts             # Utilidades generales
│   │   └── validations/
│   │       ├── client.ts
│   │       ├── deal.ts
│   │       ├── project.ts
│   │       └── task.ts
│   ├── actions/
│   │   ├── clients.ts
│   │   ├── deals.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── organizations.ts
│   ├── hooks/
│   │   ├── use-clients.ts
│   │   ├── use-deals.ts
│   │   └── use-organization.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Configuración de Better Auth

### Archivo: `src/lib/auth.ts` (Server Config)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Cambiar a true en producción
  },

  // Session configuration con cookie cache JWT
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache de 5 minutos
    },
  },

  // Plugins
  plugins: [
    organization({
      // Configuración del plugin organization
      allowUserToCreateOrganization: true,
      organizationLimit: 5, // Máximo 5 orgs por usuario en free tier
      creatorRole: "owner",
      membershipLimit: 10, // Máximo 10 miembros por org en free tier

      // Roles disponibles
      roles: {
        owner: {
          permissions: ["*"], // Todos los permisos
        },
        admin: {
          permissions: [
            "organization:update",
            "member:invite",
            "member:remove",
            "client:*",
            "deal:*",
            "project:*",
            "task:*",
          ],
        },
        member: {
          permissions: [
            "client:read",
            "client:create",
            "client:update",
            "deal:*",
            "project:read",
            "task:*",
          ],
        },
      },
    }),
  ],

  // Rate limiting (básico)
  rateLimit: {
    window: 60, // 1 minuto
    max: 100, // 100 requests por minuto
  },

  // Trusted origins
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_APP_URL!,
  ],
});

// Tipo exportado para usar en toda la app
export type Session = typeof auth.$Infer.Session;
```

### Archivo: `src/lib/auth-client.ts` (Client Config)

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [organizationClient()],
});

// Exportar hooks y utilidades
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
  organization,
} = authClient;
```

### Archivo: `src/middleware.ts` (Route Protection)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/signup", "/api/auth", "/api/webhooks"];

// Rutas que requieren organización activa
const orgRequiredRoutes = ["/dashboard", "/clients", "/pipeline", "/projects", "/tasks", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Obtener sesión
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Si no hay sesión, redirect a login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Para rutas que requieren org, verificar que haya org activa
  if (orgRequiredRoutes.some(route => pathname.startsWith(route))) {
    if (!session.session.activeOrganizationId) {
      return NextResponse.redirect(new URL("/select-org", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
```

---

## Variables de Entorno

### Archivo: `.env.example`

```env
# ===========================================
# DATABASE
# ===========================================
# Neon PostgreSQL connection string
# Formato: postgresql://user:password@host/database?sslmode=require
DATABASE_URL="postgresql://..."

# Para Prisma Accelerate (opcional, para edge functions)
# DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
# DIRECT_URL="postgresql://..." # URL directa para migraciones

# ===========================================
# BETTER AUTH
# ===========================================
# Secret para firmar cookies/tokens (mínimo 32 caracteres)
# Generar con: openssl rand -base64 32
BETTER_AUTH_SECRET=""

# URL base de la aplicación
BETTER_AUTH_URL="http://localhost:3000"

# ===========================================
# STRIPE
# ===========================================
# API Keys (usar test mode en desarrollo)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Webhook secret (obtener de Stripe Dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET="whsec_..."

# IDs de productos/precios en Stripe
STRIPE_PRICE_FREE="price_..."
STRIPE_PRICE_PRO="price_..."
STRIPE_PRICE_ENTERPRISE="price_..."

# ===========================================
# APPLICATION
# ===========================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="CRMPro"

# ===========================================
# EMAIL (Resend - opcional)
# ===========================================
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@tudominio.com"

# ===========================================
# RATE LIMITING (Upstash - opcional)
# ===========================================
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ===========================================
# MONITORING (opcional)
# ===========================================
SENTRY_DSN=""
```

### Variables por Entorno

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | Neon dev branch | Neon main branch |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://tudominio.com` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://tudominio.com` |
| `STRIPE_*` | Test keys | Live keys |

---

## Seguridad Multi-Tenant

### Principios de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPAS DE SEGURIDAD                          │
├─────────────────────────────────────────────────────────────────┤
│  1. MIDDLEWARE (Next.js)                                        │
│     └── Valida sesión y org activa antes de cualquier route    │
├─────────────────────────────────────────────────────────────────┤
│  2. SERVER ACTIONS                                              │
│     └── Re-valida sesión y permisos en cada mutación           │
├─────────────────────────────────────────────────────────────────┤
│  3. PRISMA MIDDLEWARE                                           │
│     └── Inyecta filtro organizationId en TODAS las queries     │
├─────────────────────────────────────────────────────────────────┤
│  4. DATABASE CONSTRAINTS                                        │
│     └── FK + índices + RLS (opcional) como última defensa      │
└─────────────────────────────────────────────────────────────────┘
```

### Prisma Middleware para Aislamiento

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cliente base de Prisma
const prismaBase = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaBase;
}

// Modelos que requieren filtrado por organizationId
const TENANT_MODELS = ["Client", "Deal", "Project", "Task", "CustomField"];

// Tipo para el contexto del tenant
interface TenantContext {
  organizationId: string;
  userId: string;
}

// Función para crear cliente Prisma con contexto de tenant
export function createTenantPrisma(context: TenantContext) {
  return prismaBase.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async findFirst({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async findUnique({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            // Para findUnique, convertimos a findFirst con filtro
            const result = await prismaBase[model as any].findFirst({
              where: {
                ...args.where,
                organizationId: context.organizationId,
              },
              include: args.include,
              select: args.select,
            });
            return result;
          }
          return query(args);
        },

        async create({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            // Forzar organizationId del contexto
            args.data = {
              ...args.data,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async createMany({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({
                ...item,
                organizationId: context.organizationId,
              }));
            }
          }
          return query(args);
        },

        async update({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            // Verificar que el registro pertenece al tenant
            const existing = await prismaBase[model as any].findFirst({
              where: {
                ...args.where,
                organizationId: context.organizationId,
              },
            });

            if (!existing) {
              throw new Error(`[SECURITY] Unauthorized access attempt to ${model}`);
            }

            // Prevenir cambio de organizationId
            if (args.data.organizationId && args.data.organizationId !== context.organizationId) {
              throw new Error(`[SECURITY] Cannot change organizationId`);
            }
          }
          return query(args);
        },

        async updateMany({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async delete({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            // Verificar que el registro pertenece al tenant
            const existing = await prismaBase[model as any].findFirst({
              where: {
                ...args.where,
                organizationId: context.organizationId,
              },
            });

            if (!existing) {
              throw new Error(`[SECURITY] Unauthorized delete attempt on ${model}`);
            }
          }
          return query(args);
        },

        async deleteMany({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async count({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },

        async aggregate({ model, operation, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = {
              ...args.where,
              organizationId: context.organizationId,
            };
          }
          return query(args);
        },
      },
    },
  });
}

// Cliente sin contexto (solo para auth y operaciones admin)
export const prisma = prismaBase;

// Helper para obtener cliente con contexto desde session
export async function getPrismaWithContext(session: {
  session: { activeOrganizationId: string | null };
  user: { id: string };
}) {
  if (!session.session.activeOrganizationId) {
    throw new Error("[SECURITY] No active organization in session");
  }

  return createTenantPrisma({
    organizationId: session.session.activeOrganizationId,
    userId: session.user.id,
  });
}
```

### Validación en Server Actions

```typescript
// src/actions/clients.ts
"use server";

import { auth } from "@/lib/auth";
import { getPrismaWithContext } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Security note: Esta action valida:
// 1. Sesión activa (via auth.api.getSession)
// 2. Organización activa en sesión
// 3. Filtrado automático por organizationId via Prisma middleware
// 4. Input validation con Zod

export async function createClient(formData: FormData) {
  // 1. Validar sesión
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized: No session");
  }

  if (!session.session.activeOrganizationId) {
    throw new Error("Unauthorized: No active organization");
  }

  // 2. Validar input con Zod
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    status: formData.get("status") || "lead",
  };

  const validatedData = clientSchema.parse(rawData);

  // 3. Obtener Prisma con contexto (auto-filtra por org)
  const db = await getPrismaWithContext(session);

  // 4. Crear cliente (organizationId se inyecta automáticamente)
  const client = await db.client.create({
    data: validatedData,
  });

  // 5. Revalidar cache
  revalidatePath("/clients");

  return { success: true, client };
}

export async function getClients() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session.activeOrganizationId) {
    throw new Error("Unauthorized");
  }

  const db = await getPrismaWithContext(session);

  // Solo retorna clientes de la org activa (filtrado automático)
  const clients = await db.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return clients;
}
```

### Security Checklist

- [ ] **Cookies**: HttpOnly, Secure, SameSite=Strict (configurado por Better Auth)
- [ ] **Session validation**: En cada Server Action y Route Handler
- [ ] **Organization validation**: activeOrganizationId siempre presente para rutas protegidas
- [ ] **Prisma middleware**: Filtra TODAS las queries por organizationId
- [ ] **Input validation**: Zod schemas en todos los forms/actions
- [ ] **No client-side secrets**: Ningún dato sensible expuesto
- [ ] **Rate limiting**: Configurado en Better Auth + Upstash opcional
- [ ] **Logging**: Errores de seguridad logueados para auditoría
- [ ] **CORS**: Solo orígenes trusted permitidos

### Tests de Aislamiento

```bash
# Test manual recomendado después de MVP:
1. Crear Usuario A con Org A
2. Crear Usuario B con Org B
3. Con Usuario A, crear clientes/deals
4. Con Usuario B, intentar acceder a datos de Org A
5. Verificar que retorna vacío o error (no datos cruzados)
6. Verificar logs por intentos de acceso no autorizado
```

---

## Deployment con EasyPanel

### Paso 1: Preparar Repositorio

```bash
# Inicializar git
git init

# Agregar .gitignore
cat << 'EOF' > .gitignore
# dependencies
node_modules
.pnpm-store

# next.js
.next
out

# env files
.env
.env.local
.env.*.local

# prisma
prisma/migrations/**/migration_lock.toml

# misc
.DS_Store
*.pem
*.log
EOF

# Commit inicial
git add .
git commit -m "Initial commit: CRMPro setup"

# Crear repo en GitHub y push
gh repo create crmdev --private --source=. --push
```

### Paso 2: Configurar Base de Datos

**Opción A: Neon (Recomendado)**
1. Ir a [Neon Console](https://console.neon.tech)
2. Crear nuevo proyecto: `crmdev-production`
3. Copiar connection string
4. Crear branch `development` para desarrollo

**Opción B: Supabase**
1. Ir a [Supabase](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar connection string desde Settings > Database

```bash
# Aplicar schema a la base de datos
pnpm db:push

# Generar cliente
pnpm db:generate
```

### Paso 3: Configurar EasyPanel

1. **Conectar EasyPanel con GitHub**
   - En EasyPanel, ir a Projects > New Project
   - Conectar cuenta de GitHub
   - Seleccionar repositorio `crmdev`

2. **Configurar el contenedor Docker**
   ```dockerfile
   # next.config.js debe tener:
   output: 'standalone'
   ```

3. **Configurar variables de entorno en EasyPanel**
   ```
   DATABASE_URL=postgresql://...
   BETTER_AUTH_SECRET=...
   BETTER_AUTH_URL=https://tu-dominio.com
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
   NEXT_PUBLIC_MCP_PUBLIC_URL=https://tu-dominio.com
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@tudominio.com
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Build Configuration**
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`
   - Node Version: `20`

5. **Deploy**

### Paso 4: Configurar Dominio Personalizado

1. En EasyPanel > Project > Domains
2. Agregar dominio: `crm.tudominio.com`
3. Configurar DNS según instrucciones de EasyPanel
4. Habilitar HTTPS (Let's Encrypt automático)
5. Actualizar variables de entorno con nuevo dominio

### Paso 5: Configurar Stripe Webhooks

1. En Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Seleccionar eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copiar signing secret a variables de entorno de EasyPanel

### Paso 6: Verificar Deploy

```bash
# Verificar que todo funciona
curl https://tu-dominio.com/api/health

# Verificar logs en EasyPanel Dashboard
# Verificar que no hay errores de conexión a DB
```

📖 **Guía completa de deployment**: [Ver guía de EasyPanel](./docs/deployment/easypanel.md)

### Prisma en Edge (Opcional)

Si usas Edge Runtime en algunas rutas:

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

// Para Edge, usar Prisma Accelerate
// DATABASE_URL debe ser URL de Accelerate
```

---

## Guía de Desarrollo

### Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Iniciar servidor de desarrollo
pnpm build                  # Build de producción
pnpm start                  # Iniciar build de producción

# Prisma
pnpm prisma studio          # Abrir Prisma Studio (GUI)
pnpm prisma db push         # Sincronizar schema con DB
pnpm prisma generate        # Regenerar cliente
pnpm prisma migrate dev     # Crear migración
pnpm prisma migrate deploy  # Aplicar migraciones en producción

# Linting/Format
pnpm lint                   # Ejecutar ESLint
pnpm lint --fix             # Arreglar errores automáticamente

# Type checking
pnpm tsc --noEmit           # Verificar tipos sin compilar
```

### Flujo de Desarrollo Recomendado

```
1. Crear branch feature/xxx
2. Desarrollar con `pnpm dev`
3. Testear manualmente multi-tenant
4. Commit y push
5. Vercel hace preview deploy
6. Merge a main -> producción
```

### Estructura de un Módulo

Cada módulo (clients, deals, projects, tasks) sigue esta estructura:

```
module/
├── page.tsx           # Server Component con fetch inicial
├── [id]/
│   └── page.tsx       # Detalle/edición
├── components/
│   ├── list.tsx       # Lista/tabla
│   ├── form.tsx       # Formulario crear/editar
│   └── card.tsx       # Card para vistas grid
└── actions.ts         # Server Actions del módulo
```

### Convenciones de Código

```typescript
// Server Components: async function con fetch directo
async function ClientsPage() {
  const clients = await getClients();
  return <ClientList clients={clients} />;
}

// Client Components: "use client" + hooks
"use client";
function ClientForm() {
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
  });
  // ...
}

// Server Actions: "use server" + validación + revalidate
"use server";
async function createClient(data: FormData) {
  // validar session, validar input, crear, revalidar
}
```

---

## Documentación Adicional

Para documentación detallada del proyecto, visita la carpeta [`docs/`](./docs/):

### 📚 Arquitectura
- [**Vista General del Sistema**](./docs/architecture/system-overview.md) - Arquitectura completa, stack tecnológico y estructura del proyecto
- [**Integración MCP**](./docs/architecture/mcp-integration.md) - Arquitectura de MCP (Model Context Protocol)
- [**Multi-Tenancy**](./docs/architecture/multi-tenancy.md) - Estrategia de aislamiento de datos entre organizaciones

### 🚀 Guías
- [**Setup Claude Desktop**](./docs/guides/claude-desktop-setup.md) - Configurar Claude Desktop con MCP
- [**Gestión de API Keys**](./docs/guides/api-keys.md) - Crear y gestionar API Keys para integraciones
- [**Configuración de Email**](./docs/guides/email-setup.md) - Configurar Resend para emails

### 🔧 Deployment
- [**Despliegue en EasyPanel**](./docs/deployment/easypanel.md) - Guía completa de deployment con Docker

### 🔌 API
- [**Webhooks**](./docs/api/webhooks.md) - Documentación de webhooks disponibles

---

## Características Adicionales

### 🔐 Seguridad Implementada
- ✅ **Multi-tenant isolation**: Middleware de Prisma filtra automáticamente por `organizationId`
- ✅ **Rate limiting**: Upstash Redis para protección contra DoS
- ✅ **CORS whitelist**: Solo orígenes permitidos pueden acceder a la API
- ✅ **Session management**: Better Auth con JWT cache y cookies seguras
- ✅ **Input validation**: Zod schemas en todos los Server Actions

### 🤖 Integraciones AI
- **MCP Protocol**: API abierta para integración con asistentes AI
- **Claude Desktop**: Soporte nativo para Claude Desktop
- **ChatGPT**: Compatible con cualquier cliente MCP
- **Custom Tools**: Herramientas personalizables para cada organización

### 📊 Monitorización
- **WordPress Monitor**: Updates, vulnerabilidades, SSL
- **Time Tracking**: Registro de tiempo por tarea
- **Ticket System**: Soporte con categorización AI

---

## Próximos Pasos

Características planificadas para futuras versiones:

1. **Integraciones**
   - WhatsApp Business API
   - Google Calendar sync
   - Email tracking avanzado

2. **IA Features**
   - Resumen automático de clientes
   - Predicción de cierre de deals
   - Asistente de ventas con contexto

3. **Analytics**
   - Dashboard con métricas avanzadas
   - Reportes exportables (PDF, Excel)
   - Funnel analytics

4. **Mobile**
   - PWA con offline support
   - Push notifications

---

## Soporte y Contribución

- **Issues**: Reportar bugs en [GitHub Issues](https://github.com/tu-usuario/crmdev/issues)
- **Documentación**: Ver carpeta [`docs/`](./docs/)
- **Security**: Reportar vulnerabilidades de forma privada

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo [LICENSE](./LICENSE) para más detalles.

---

**Versión**: 1.0.0
**Última actualización**: 2026-03-10
**Stack**: Next.js 15 · TypeScript · Prisma · Better Auth · MCP
