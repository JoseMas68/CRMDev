# Vista General del Sistema

## Arquitectura de CRMPro

CRMPro es un CRM multi-tenant SaaS construido con tecnologías modernas y enfocado en desarrolladores.

## Stack Tecnológico

### Frontend
- **Next.js 15** (App Router)
  - React Server Components (RSC)
  - Turbopack para desarrollo rápido
  - Optimización automática de imágenes y fuentes

### Backend
- **Next.js API Routes** y **Server Actions**
  - Lógica de servidor en TypeScript
  - Validación con Zod
  - Revalidación de cache automática

### Base de Datos
- **PostgreSQL** (Neon/Supabase recomendado)
  - Base de datos compartida con aislamiento por tenant
  - Connection pooling con Prisma Accelerate
  - Migraciones versionadas con Prisma

### Autenticación y Autorización
- **Better Auth**
  - Autenticación basada en sesiones (JWT)
  - Plugin de organizaciones para multi-tenancy
  - OAuth providers (GitHub)
  - 2FA disponible

### Integraciones
- **Stripe** - Gestión de suscripciones
- **Resend** - Envío de emails transaccionales
- **MCP** - Model Context Protocol para integraciones con IA

## Arquitectura Multi-Tenant

CRMPro utiliza un enfoque de **base de datos compartida con aislamiento por tenant**:

```
Base de Datos PostgreSQL (Compartida)
├── organizations (Tabla central)
│   ├── id, name, slug, plan, seats
│   └── organizationId (FK en todas las tablas de tenants)
│
├── Tablas de Tenant (datos aislados por organización)
│   ├── clients (organizationId)
│   ├── deals (organizationId)
│   ├── projects (organizationId)
│   ├── tasks (organizationId)
│   ├── custom_fields (organizationId)
│   ├── pipeline_stages (organizationId)
│   └── activities (organizationId)
│
└── Tablas Globales (compartidas)
    ├── users (autenticación)
    ├── sessions (sesiones de usuario)
    ├── organizations (metadatos)
    └── api_keys (integraciones MCP)
```

### Capas de Seguridad

1. **Middleware de Prisma** (Filtro automático por organización)
   - Todas las queries de tenant se filtran automáticamente por `organizationId`
   - Las operaciones CREATE inyectan `organizationId` automáticamente
   - Las operaciones UPDATE/DELETE verifican ownership antes de ejecutar

2. **Server Actions** (Validación de sesión)
   - Validan la sesión del usuario con Better Auth
   - Verifican que el usuario tenga `activeOrganizationId`
   - Usan Prisma con contexto de tenant

3. **Middleware HTTP** (Protección de rutas)
   - Verifica existencia de cookie de sesión
   - Redirige usuarios no autenticados a `/login`
   - Rutas públicas: `/`, `/login`, `/signup`, `/api/auth`, `/api/webhooks`

## Flujo de Autenticación

```
1. Usuario navega a la app
       ↓
2. Middleware verifica cookie de sesión
       ↓
3. Si no hay sesión → redirect a /login
       ↓
4. Usuario hace login con email/password
       ↓
5. Better Auth valida credenciales
       ↓
6. Crea sesión con JWT (7 días de validez)
       ↓
7. Cookie seteada: crmdev.session
       ↓
8. Usuario selecciona organización (si tiene varias)
       ↓
9. activeOrganizationId añadido a sesión
       ↓
10. Todas las requests usan esa organización
```

## Estructura del Proyecto

```
crmpro/
├── prisma/
│   └── schema.prisma              # Schema de base de datos
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/               # Rutas de autenticación
│   │   ├── (dashboard)/          # Rutas protegidas
│   │   └── api/                  # API Routes
│   │       ├── mcp/              # Endpoints MCP
│   │       └── webhooks/         # Webhooks externos
│   ├── actions/                  # Server Actions
│   ├── components/               # Componentes React
│   │   ├── ui/                  # Shadcn UI components
│   │   └── [feature]/           # Feature components
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server config
│   │   ├── auth-client.ts       # Better Auth client config
│   │   ├── prisma.ts            # Prisma con middleware de tenant
│   │   ├── mcp.ts               # MCP server + tools
│   │   └── validations/         # Zod schemas
│   └── middleware.ts             # Next.js middleware
├── docs/                         # Documentación del proyecto
└── CLAUDE.md                     # Instrucciones para Claude Code
```

## Características Principales

### Gestión de Clientes
- Información de contacto completa
- Campos personalizados por organización
- Seguimiento de estado (LEAD, PROSPECT, CUSTOMER, etc.)
- Historial de actividades

### Gestión de Proyectos
- Proyectos con tareas y tiempo
- Miembros del proyecto con roles
- Seguimiento de progreso
- Tipos: GitHub, WordPress, Vercel, Otro

### Gestión de Tareas
- Tareas con asignaciones
- Prioridades y estados
- Relación con proyectos
- Time tracking por tarea

### Pipeline de Deals
- Pipeline personalizable por organización
- Arrastrar y soltar para cambiar estado
- Seguimiento de oportunidades de venta

### Integración MCP
- API REST para integraciones con IA
- Herramientas para Projects, Tasks, Clients
- Multi-usuario con API Keys por organización
- Compatible con Claude Desktop, ChatGPT, etc.

### Monitorización de WordPress
- Detección de actualizaciones disponibles
- Alertas de vulnerabilidades
- Verificación de certificados SSL
- Cron job automático

## Variables de Entorno

```bash
# Base de Datos
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="min-32-caracteres"
BETTER_AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="CRMPro"

# MCP (integraciones con IA)
NEXT_PUBLIC_MCP_PUBLIC_URL="http://localhost:3000"

# Stripe (opcional)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (opcional, Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

## Comandos de Desarrollo

```bash
# Servidor de desarrollo (con Turbopack)
pnpm dev

# Build para producción
pnpm build

# Servidor de producción
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Base de datos
pnpm db:push          # Push schema changes (dev)
pnpm db:studio        # Abrir Prisma Studio
pnpm db:generate      # Generar Prisma client
pnpm db:migrate       # Crear migración
```

## Deployment

### Opciones Recomendadas

1. **EasyPanel** (Docker)
   - Output mode: `standalone`
   - Puerto: 3000
   - Ver guía: [docs/deployment/easypanel.md](../deployment/easypanel.md)

2. **Vercel**
   - Configuración automática con Next.js
   - Base de datos: Neon/Supabase

3. **Railway**
   - Soporte para Docker y Next.js
   - PostgreSQL incluido

## Documentación Adicional

- [Arquitectura MCP](./mcp-integration.md) - Integración con Model Context Protocol
- [Multi-tenancy](./multi-tenancy.md) - Aislamiento de datos por organización
- [Guía de Despliegue](../deployment/easypanel.md) - Instrucciones de deployment
- [Configuración de Email](../guides/email-setup.md) - Setup de Resend
- [API Keys](../guides/api-keys.md) - Gestión de API Keys para MCP
- [Webhooks](../api/webhooks.md) - Endpoints de webhook
