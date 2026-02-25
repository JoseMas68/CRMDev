# Arquitectura MCP en CRMDev

## 📋 Resumen Ejecutivo

CRMDev implementa **Model Context Protocol (MCP)** para permitir que asistentes de IA (Claude, ChatGPT, etc.) interactúen con el CRM mediante herramientas (tools) bien definidas.

**Características clave:**
- ✅ **Multi-usuario**: Cada usuario usa su propia API Key
- ✅ **Multi-tenant**: Cada API Key accede solo a datos de su organización
- ✅ **Seguro**: Autenticación por API Key, aislamiento de datos por organización
- ✅ **REST simple**: Endpoint JSON fácil de integrar
- ✅ **13 herramientas**: CRUD completo de Projects, Tasks, Clients

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRMDev (https://crmdev.tech)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/mcp/rest  (REST Endpoint - Recomendado)            │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  POST {                                                   │  │
│  │    "tool": "list_projects",                              │  │
│  │    "arguments": {}                                       │  │
│  │  }                                                        │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Respuesta: { success: true, data: [...] }              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/mcp/sse (SSE Endpoint - Protocolo MCP completo)     │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  GET → Server-Sent Events stream                          │  │
│  │  POST /api/mcp/message → JSON-RPC messages                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/mcp/install (Instalador para usuarios)             │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  GET → Descarga script de instalación                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    Autenticación por API Key
                            ↓
            ┌───────────────────────────────────────┐
            │   Base de Datos (PostgreSQL)          │
            │   ├── api_keys                       │
            │   ├── organizations                  │
            │   ├── projects (por org)             │
            │   ├── tasks (por org)                │
            │   └── clients (por org)               │
            └───────────────────────────────────────┘
```

---

## 🔐 Flujo de Autenticación y Multi-tenancy

```
1. Usuario crea API Key en Settings → API Keys
        ↓
2. Sistema genera key: crm_<random>
        ↓
3. API Key guardada en base de datos con:
   - id
   - key (hash o texto)
   - organizationId ← CLAVE para multi-tenancy
   - userId (quién la creó)
   - name (nombre descriptivo)
   - lastUsedAt
        ↓
4. Cliente hace request con API Key
        ↓
5. Endpoint valida API Key y extrae organizationId
        ↓
6. Queries a BD automáticamente filtran por organizationId
        ↓
7. Usuario solo ve/modify datos de su organización
```

### Ejemplo de Aislamiento de Datos

```typescript
// Usuario A con API Key de Org X
POST /api/mcp/rest
Authorization: Bearer crm_key_A
{ "tool": "list_projects" }
→ Solo proyectos de Org X

// Usuario B con API Key de Org Y
POST /api/mcp/rest
Authorization: Bearer crm_key_B
{ "tool": "list_projects" }
→ Solo proyectos de Org Y
```

---

## 🛠️ Herramientas MCP Disponibles

### Projects (Proyectos)

| Tool | Descripción | Argumentos |
|------|-------------|------------|
| `list_projects` | Listar proyectos | `limit?: number`, `status?: ProjectStatus` |
| `create_project` | Crear proyecto | `name: string`, `description?: string`, `type?: ProjectType` |
| `update_project` | Actualizar proyecto | `projectId: string`, `name?: string`, `status?: ProjectStatus`, `progress?: number` |
| `delete_project` | Eliminar proyecto | `projectId: string` |

### Tasks (Tareas)

| Tool | Descripción | Argumentos |
|------|-------------|------------|
| `list_tasks` | Listar tareas | `limit?: number`, `projectId?: string`, `status?: TaskStatus` |
| `create_task` | Crear tarea | `title: string`, `description?: string`, `projectId?: string`, `priority?: TaskPriority` |
| `update_task` | Actualizar tarea | `taskId: string`, `title?: string`, `status?: TaskStatus`, `priority?: TaskPriority` |
| `delete_task` | Eliminar tarea | `taskId: string` |

### Clients (Clientes)

| Tool | Descripción | Argumentos |
|------|-------------|------------|
| `list_clients` | Listar clientes | `limit?: number`, `status?: ClientStatus` |
| `create_client` | Crear cliente | `name: string`, `email?: string`, `company?: string`, `status?: ClientStatus` |
| `update_client` | Actualizar cliente | `clientId: string`, `name?: string`, `status?: ClientStatus` |
| `delete_client` | Eliminar cliente | `clientId: string` |

### Time Tracking

| Tool | Descripción | Argumentos |
|------|-------------|------------|
| `get_project_time_report` | Reporte de tiempos | `projectId: string` |

---

## 📡 Endpoints API

### 1. REST Endpoint (Recomendado)

```
POST https://crmdev.tech/api/mcp/rest
Content-Type: application/json
Authorization: Bearer crm_<your_key>

{
  "tool": "list_projects",
  "arguments": {
    "limit": 10
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm123abc",
      "name": "Tienda Online",
      "status": "IN_PROGRESS",
      "progress": 45,
      "type": "WORDPRESS"
    }
  ]
}
```

### 2. SSE Endpoint (MCP Protocol)

```
GET https://crmdev.tech/api/mcp/sse
Authorization: Bearer crm_<your_key>
```

**Respuesta:** Server-Sent Events stream
```
event: endpoint
data: https://crmdev.tech/api/mcp/message?sessionId=<uuid>

event: message
data: <json-rpc-response>
```

### 3. Install Endpoint

```
GET https://crmdev.tech/api/mcp/install
```

**Respuesta:** Script de instalación para Claude Desktop

---

## 🔨 Implementación Técnica

### Backend: REST Endpoint

**Archivo:** [`src/app/api/mcp/rest/route.ts`](src/app/api/mcp/rest/route.ts)

```typescript
export async function POST(req: NextRequest) {
  // 1. Validar API Key
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: token },
    select: { organizationId: true },
  });

  // 2. Extraer organizationId
  const { organizationId } = apiKey;

  // 3. Ejecutar tool con filtro automático
  const result = await prisma.project.findMany({
    where: { organizationId }, // ← Multi-tenancy!
    take: limit || 10,
  });

  // 4. Retornar JSON
  return NextResponse.json({ success: true, data: result });
}
```

### Backend: MCP Server

**Archivo:** [`src/lib/mcp.ts`](src/lib/mcp.ts)

```typescript
const server = new McpServer({
  name: "CRMDev-MCP",
  version: "1.0.0",
});

server.tool(
  "list_projects",
  "Listar todos los proyectos de la organización",
  { limit: z.number().optional() },
  async ({ limit }, extra) => {
    // Extraer organizationId del request
    const orgId = extra._meta?.organizationId;

    // Queries filtradas por org
    const projects = await prisma.project.findMany({
      where: { organizationId: orgId },
    });

    return {
      content: [{ type: "text", text: JSON.stringify(projects) }],
    };
  }
);
```

### Cliente: Claude Desktop Proxy

**Archivo:** [`mcp-server.js`](mcp-server.js)

```typescript
// Corre localmente en máquina del usuario
const API_URL = "https://crmdev.tech/api/mcp/rest";
const API_KEY = process.env.CRM_API_KEY;

// Convierte llamadas MCP a REST
async function callTool(toolName, args) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({ tool: toolName, arguments: args }),
  });
}
```

---

## 🔄 Flujo Completo: Usuario → Claude → CRM

```
┌──────────────┐
│  Usuario     │ "Claude, crea un proyecto 'E-commerce'"
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Claude Desktop                            │
│  - Detecta tool: create_project            │
│  - Extrae args: name='E-commerce'          │
└──────┬──────────────────────────────────────┘
       │
       ▼ (stdio)
┌─────────────────────────────────────────────┐
│  mcp-server.js (local)                     │
│  - Recibe llamada MCP                      │
│  - Convierte a REST API                    │
└──────┬──────────────────────────────────────┘
       │
       ▼ (HTTPS POST)
┌─────────────────────────────────────────────┐
│  https://crmdev.tech/api/mcp/rest         │
│  - Valida API Key                          │
│  - Extrae organizationId                   │
│  - Crea proyecto en DB                     │
└──────┬──────────────────────────────────────┘
       │
       ▼ (JSON)
┌─────────────────────────────────────────────┐
│  Base de Datos                             │
│  INSERT INTO project (...)                 │
│  WHERE organizationId = 'org-abc'         │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Usuario ve en CRMDev                      │
│  Proyecto "E-commerce" creado ✅            │
└─────────────────────────────────────────────┘
```

---

## 🚀 Instalación para Usuarios

### Método 1: Instalador Automático

```bash
curl -sSL https://crmdev.tech/api/mcp/install | node - crm_TU_API_KEY
```

**Qué hace:**
1. Descarga el servidor MCP
2. Lo instala en: `~/.config/claude/crmdev-mcp-server.js`
3. Configura: `~/.config/claude/claude_desktop_config.json`
4. Usuario reinicia Claude Desktop
5. ✅ Listo

### Método 2: Manual

1. Descargar instalador: `curl -O https://crmdev.tech/api/mcp/install`
2. Ejecutar: `node install crm_TU_API_KEY`

---

## 🔒 Seguridad

### Protecciones Implementadas

1. **Autenticación**: Todas las requests requieren API Key válida
2. **Multi-tenancy**: Cada query filtra por `organizationId`
3. **Validación**: Inputs validados con Zod schemas
4. **Rate Limiting**: Protección contra abuse (implementado en Better Auth)
5. **API Key Management**: Users pueden revocar keys anytime

### Ejemplo de Validación

```typescript
// Verificar ownership antes de update/delete
const existing = await prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId: orgId  // ← Debe pertenecer a la org
  },
});

if (!existing) {
  throw new Error("Unauthorized");
}
```

---

## 📊 Monitorización

### Tracking de API Keys

En `Settings → API Keys`, cada usuario ve:
- **Nombre** de la API Key
- **Creado por** (quién y cuándo)
- **Último uso** (cuando se usó por última vez)
- **Acción** de revocar

### Actualización de lastUsedAt

```typescript
// Cada request actualiza el timestamp
await prisma.apiKey.update({
  where: { key: token },
  data: { lastUsedAt: new Date() },
});
```

---

## 🧪 Testing

### Test Manual con cURL

```bash
# Listar proyectos
curl -X POST https://crmdev.tech/api/mcp/rest \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer crm_YOUR_KEY" \\
  -d '{"tool": "list_projects", "arguments": {}}'

# Crear proyecto
curl -X POST https://crmdev.tech/api/mcp/rest \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer crm_YOUR_KEY" \\
  -d '{"tool": "create_project", "arguments": {"name": "Test"}}'
```

### Test con Script Incluido

```bash
node scripts/test-mcp-rest.js
```

---

## 📚 Referencias

- **MCP Protocol**: https://modelcontextprotocol.io
- **Documentación Usuario**: [CLAUDE_DESKTOP_SETUP.md](CLAUDE_DESKTOP_SETUP.md)
- **Instalador**: https://crmdev.tech/api/mcp/install
- **API REST**: https://crmdev.tech/api/mcp/rest

---

## 🎯 Casos de Uso

### Para Usuarios Finales

- **Gestión por voz**: "Claude, crea una tarea urgente para llamar a Juan"
- **Quick updates**: "Claude, marca el proyecto X como completado"
- **Reporting**: "Claude, ¿cuántas horas se trabajaron este mes?"

### Para Integraciones

- **Automatización**: Scripts que gestionan proyectos automáticamente
- **Sync con otras herramientas**: Zapier, Make, etc. pueden usar la API
- **Custom dashboards**: Pull data del CRM para analytics

---

## 🔄 Futuro

### Planeado

- [ ] Más tools: Deals, Pipeline Stages, Time Entries CRUD
- [ ] Webhooks: Notificar a IA cuando hay cambios en el CRM
- [ ] Filters avanzados: Búsqueda full-text en list_tools
- [ ] Batch operations: Crear múltiples tasks a la vez

### MCP Móvil

Cuando Anthropic añada soporte MCP móvil:
- ✅ La misma API Key funcionará en móvil
- ✅ Voz para gestionar CRM desde el celular
- ✅ Integración nativa sin configuración extra
