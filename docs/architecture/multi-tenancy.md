# Arquitectura Multi-Tenant

## Visión General

CRMPro implementa un modelo **multi-tenant con base de datos compartida**, donde todas las organizaciones comparten la misma infraestructura pero sus datos están completamente aislados.

## Modelo de Aislamiento

### Estrategia: Shared Database, Tenant Isolation

```
┌─────────────────────────────────────────────────────────┐
│           Base de Datos PostgreSQL (Compartida)         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tablas Globales (Compartidas)                  │   │
│  │  ├── users (autenticación)                      │   │
│  │  ├── sessions (sesiones)                        │   │
│  │  ├── organizations (metadatos)                  │   │
│  │  └── api_keys (integraciones)                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tablas de Tenant (Aisladas por organizationId) │   │
│  │                                                  │   │
│  │  Org A: org_a123                                │   │
│  │  ├── clients WHERE organizationId = 'org_a123'  │   │
│  │  ├── deals WHERE organizationId = 'org_a123'    │   │
│  │  ├── projects WHERE organizationId = 'org_a123' │   │
│  │  └── tasks WHERE organizationId = 'org_a123'    │   │
│  │                                                  │   │
│  │  Org B: org_b456                                │   │
│  │  ├── clients WHERE organizationId = 'org_b456'  │   │
│  │  ├── deals WHERE organizationId = 'org_b456'    │   │
│  │  ├── projects WHERE organizationId = 'org_b456' │   │
│  │  └── tasks WHERE organizationId = 'org_b456'    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Capas de Seguridad

### 1. Middleware de Prisma (Capa de Datos)

**Archivo:** [`src/lib/prisma.ts`](../../src/lib/prisma.ts)

El middleware de Prisma intercepta todas las queries y automáticamente:

- **Filtra** las queries SELECT por `organizationId`
- **Inyecta** `organizationId` en las queries INSERT
- **Verifica** ownership en las queries UPDATE/DELETE

```typescript
// Arrays que definen qué modelos son de tenant
const TENANT_MODELS = [
  "client",
  "deal",
  "project",
  "task",
  "customField",
  "pipelineStage",
  "activity",
];

// Middleware automático
prisma.$use(async (params, next) => {
  // Extraer organizationId del contexto
  const organizationId = params.organizationId;

  if (TENANT_MODELS.includes(params.model)) {
    // SELECT: filtrar por organizationId
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args.where = {
        ...params.args.where,
        organizationId,
      };
    }

    // CREATE: inyectar organizationId
    if (params.action === "create") {
      params.args.data.organizationId = organizationId;
    }

    // UPDATE/DELETE: verificar ownership
    if (params.action === "update" || params.action === "delete") {
      params.args.where.organizationId = organizationId;
    }
  }

  return next(params);
});
```

### 2. Server Actions (Capa de Lógica)

**Patrón estándar** en todos los Server Actions:

```typescript
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getPrismaWithSession } from "@/lib/prisma";

export async function createClient(data: CreateClientInput) {
  // 1. Validar sesión
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 2. Verificar que hay organización activa
  if (!session?.session.activeOrganizationId) {
    return { success: false, error: "No active organization" };
  }

  // 3. Obtener Prisma con contexto de tenant
  //    (automatically filters by organizationId)
  const db = await getPrismaWithSession(session);

  // 4. Ejecutar operación
  //    (organizationId se inyecta automáticamente)
  const client = await db.client.create({
    data: {
      name: data.name,
      email: data.email,
      // organizationId: inyectado por middleware
    },
  });

  return { success: true, data: client };
}
```

### 3. Middleware HTTP (Capa de Ruta)

**Archivo:** [`src/middleware.ts`](../../src/middleware.ts)

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Verificar existencia de cookie de sesión
  const isLoggedIn = !!req.auth;
  const isOnPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  // Redirigir si no está autenticado
  if (!isLoggedIn && !isOnPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

// Rutas públicas
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
  "/api/webhooks",
];
```

## Gestión de Organizaciones

### Cambio de Organización

Los usuarios pueden ser miembros de múltiples organizaciones:

```typescript
// En la sesión del usuario
{
  user: {
    id: "user_123",
    name: "Juan Pérez",
    email: "juan@example.com"
  },
  session: {
    activeOrganizationId: "org_a123", // ← Organización actual
    organizations: [
      { id: "org_a123", name: "Empresa A", role: "owner" },
      { id: "org_b456", name: "Empresa B", role: "member" },
    ]
  }
}
```

### Server Action para Cambiar Org

```typescript
export async function setActiveOrganization(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verificar que el usuario es miembro de la org
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId: organizationId,
    },
  });

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  // Actualizar sesión
  await auth.api.updateSession({
    headers: await headers(),
    body: {
      activeOrganizationId: organizationId,
    },
  });
}
```

## Roles y Permisos

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| `owner` | Acceso completo, puede eliminar la organización |
| `admin` | Gestión completa excepto eliminar organización |
| `member` | Acceso limitado (lectura y creación básica) |

### Implementación de Permisos

```typescript
// En un Server Action
export async function deleteProject(projectId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Obtener rol del usuario en la organización
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: session.session.activeOrganizationId,
      },
    },
  });

  // Verificar permisos
  if (membership.role === "member") {
    return { success: false, error: "Insufficient permissions" };
  }

  // Ejecutar acción
  await prisma.project.delete({
    where: { id: projectId },
  });
}
```

## Aislamiento de Datos en Práctica

### Ejemplo 1: Listar Proyectos

```typescript
// Usuario con activeOrganizationId = "org_a123"
const projects = await prisma.project.findMany({
  // El middleware automáticamente añade:
  // WHERE organizationId = 'org_a123'
});

// Resultado: solo proyectos de org_a123
```

### Ejemplo 2: Crear Cliente

```typescript
// Usuario con activeOrganizationId = "org_a123"
const client = await prisma.client.create({
  data: {
    name: "ACME Corp",
    email: "contact@acme.com",
    // El middleware automáticamente inyecta:
    // organizationId: 'org_a123'
  },
});
```

### Ejemplo 3: Intentar Acceder a Datos de Otro Tenant

```typescript
// Usuario de org_a123 intenta acceder a proyecto de org_b456
try {
  const project = await prisma.project.findFirst({
    where: {
      id: "project_from_org_b456", // ← De otra organización
    },
    // El middleware automáticamente añade:
    // WHERE organizationId = 'org_a123' AND id = 'project_from_org_b456'
  });
} catch (error) {
  // Result: null (no encuentra nada)
  // O error si usas findUnique()
}
```

## Integración MCP y Multi-Tenancy

Las API Keys también están aisladas por organización:

```typescript
// Estructura de API Key
{
  id: "key_123",
  key: "crm_abc123xyz", // ← Key única
  organizationId: "org_a123", // ← Vinculada a org
  userId: "user_456", // ← Creada por usuario
  name: "Claude Desktop - Juan",
  lastUsedAt: "2026-03-10T10:00:00Z"
}
```

### Flujo de Request MCP

```
1. Request con API Key
   Authorization: Bearer crm_abc123xyz
        ↓
2. Validar API Key en DB
   SELECT * FROM api_keys WHERE key = 'crm_abc123xyz'
        ↓
3. Extraer organizationId
   organizationId = 'org_a123'
        ↓
4. Ejecutar query con filtro
   SELECT * FROM projects WHERE organizationId = 'org_a123'
        ↓
5. Retornar solo datos de esa organización
```

## Mejores Prácticas

### ✅ Siempre Hacer

1. **Usar `getPrismaWithSession(session)`** en Server Actions
2. **Validar `activeOrganizationId`** antes de operaciones
3. **Verificar membresía** cuando un usuario intenta acceder a recursos
4. **Usar middleware de Prisma** para aislamiento automático
5. **Verificar roles** para operaciones sensibles

### ❌ Nunca Hacer

1. **NO usar `prisma` directamente** sin contexto de sesión
2. **NO confiar en el cliente** para enviar `organizationId`
3. **NO omitir validación de sesión** en Server Actions
4. **NO exponer `organizationId` en URLs o UI**
5. **NO mezclar datos de diferentes organizaciones**

## Troubleshooting

### Problema: Data Leak entre Organizaciones

**Síntoma:** Un usuario ve datos de otra organización.

**Causas posibles:**
1. No usar `getPrismaWithSession()`
2. Falta de `activeOrganizationId` en sesión
3. Middleware de Prisma no está activo

**Solución:**
```typescript
// ❌ INCORRECTO
const projects = await prisma.project.findMany();

// ✅ CORRECTO
const session = await auth.api.getSession({ headers: await headers() });
const db = await getPrismaWithSession(session);
const projects = await db.project.findMany();
```

### Problema: "Unauthorized" al Crear Recursos

**Síntoma:** Error de autorización al crear clientes/proyectos.

**Causas posibles:**
1. No hay `activeOrganizationId` en sesión
2. Usuario no es miembro de la organización

**Solución:**
```typescript
// Verificar que hay organización activa
if (!session?.session.activeOrganizationId) {
  return { success: false, error: "No active organization" };
}
```

## Referencias

- [Implementación de Prisma Middleware](../../src/lib/prisma.ts)
- [Server Actions Example](../../src/actions/)
- [Better Auth Organizations](https://www.better-auth.com/docs/plugins/organization)
