# MCP REST API Documentation

API REST para integración con IA (Claude, ChatGPT, etc.)

## Base URL

**Producción:** `https://crmdev.tech/api/mcp/rest`
**Desarrollo:** `http://localhost:3000/api/mcp/rest`

## Autenticación

Todas las requests requieren un header `Authorization` con un API Key:

```bash
Authorization: Bearer crm_YOUR_API_KEY_HERE
```

**Cómo obtener API Key:**
1. Entra a CRMDev → Settings → API Keys
2. Crea una nueva API Key
3. Cada organización tiene sus propias API Keys

## Formato de Request

### Discovery (GET)
Para obtener la lista de todos los endpoints disponibles:

```bash
curl -X GET https://crmdev.tech/api/mcp/rest \
  -H "Authorization: Bearer crm_YOUR_KEY"
```

**Respuesta:**
```json
{
  "success": true,
  "count": 18,
  "tools": {
    "list_projects": {
      "description": "Listar todos los proyectos de la organización activa del usuario",
      "parameters": { ... }
    },
    ...
  }
}
```

### Ejecutar Tool (POST)

```json
{
  "tool": "nombre_del_tool",
  "arguments": {
    "parametro1": "valor",
    "parametro2": "valor"
  }
}
```

## Endpoints Disponibles (18 tools)

---

### 📁 PROYECTOS (4 tools)

#### 1. list_projects
Lista todos los proyectos de la organización.

**Arguments:**
```json
{
  "limit": 10,        // Opcional, default: 10
  "status": "IN_PROGRESS"  // Opcional: NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
}
```

#### 2. create_project
Crea un nuevo proyecto.

**Arguments:**
```json
{
  "name": "Nombre del proyecto",
  "description": "Descripción",  // Opcional
  "type": "OTHER",               // Opcional: GITHUB, WORDPRESS, VERCEL, OTHER
  "status": "NOT_STARTED",       // Opcional: NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
  "clientId": "client_id"        // Opcional
}
```

#### 3. update_project
Actualiza un proyecto existente.

**Arguments:**
```json
{
  "projectId": "project_id",
  "name": "Nuevo nombre",         // Opcional
  "description": "Nueva desc",    // Opcional
  "status": "IN_PROGRESS",        // Opcional
  "progress": 75                  // Opcional (0-100)
}
```

#### 4. delete_project
Elimina un proyecto ( irreversible).

**Arguments:**
```json
{
  "projectId": "project_id"
}
```

---

### ✅ TAREAS (4 tools)

#### 5. list_tasks
Lista tareas con filtros.

**Arguments:**
```json
{
  "limit": 20,                   // Opcional, default: 20
  "projectId": "project_id",     // Opcional
  "status": "TODO",               // Opcional: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED
}
```

#### 6. create_task
Crea una nueva tarea con asignación y fecha límite.

**Arguments:**
```json
{
  "title": "Título de la tarea",
  "description": "Descripción detallada",  // Opcional
  "projectId": "project_id",                // Opcional
  "assigneeId": "user_id",                   // Opcional - ID del miembro asignado
  "status": "TODO",                          // Opcional: TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED
  "priority": "MEDIUM",                      // Opcional: LOW, MEDIUM, HIGH, URGENT
  "dueDate": "2026-03-15"                   // Opcional - Fecha límite ISO 8601
}
```

#### 7. update_task
Actualiza una tarea.

**Arguments:**
```json
{
  "taskId": "task_id",
  "title": "Nuevo título",        // Opcional
  "description": "Nueva desc",  // Opcional
  "status": "IN_PROGRESS",       // Opcional
  "priority": "HIGH"             // Opcional
}
```

#### 8. delete_task
Elimina una tarea ( irreversible).

**Arguments:**
```json
{
  "taskId": "task_id"
}
```

---

### 👥 CLIENTES (4 tools)

#### 9. list_clients
Lista clientes con filtros.

**Arguments:**
```json
{
  "limit": 20,                    // Opcional, default: 20
  "status": "CUSTOMER"            // Opcional: LEAD, PROSPECT, CUSTOMER, INACTIVE, CHURNED
}
```

#### 10. create_client
Crea un nuevo cliente.

**Arguments:**
```json
{
  "name": "Nombre del cliente",
  "email": "cliente@example.com",  // Opcional
  "company": "Empresa",            // Opcional
  "phone": "+34 123 456 789",      // Opcional
  "status": "LEAD",                // Opcional: LEAD, PROSPECT, CUSTOMER, INACTIVE, CHURNED
  "source": "web",                  // Opcional
  "notes": "Notas"                   // Opcional
}
```

#### 11. update_client
Actualiza un cliente.

**Arguments:**
```json
{
  "clientId": "client_id",
  "name": "Nuevo nombre",     // Opcional
  "email": "nuevo@email.com",  // Opcional
  "company": "Nueva empresa",  // Opcional
  "status": "CUSTOMER",         // Opcional
  "notes": "Nuevas notas"       // Opcional
}
```

#### 12. delete_client
Elimina un cliente ( irreversible).

**Arguments:**
```json
{
  "clientId": "client_id"
}
```

---

### 👥 MIEMBROS (1 tool)

#### 13. list_members ⭐ NUEVO
Lista miembros de la organización para asignar tareas.

**Arguments:**
```json
{
  "limit": 50  // Opcional, default: 50
}
```

**Respuesta:**
```json
[
  {
    "user": {
      "id": "user_id",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "image": "avatar_url"
    },
    "role": "MEMBER"  // MEMBER, ADMIN
  }
]
```

---

### 🎫 TICKETS (4 tools) ⭐ NUEVOS

#### 14. list_tickets
Lista tickets de soporte.

**Arguments:**
```json
{
  "limit": 20,                           // Opcional, default: 20
  "status": "OPEN",                       // Opcional: OPEN, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CLOSED
  "priority": "HIGH",                     // Opcional: LOW, MEDIUM, HIGH, URGENT
  "category": "BUG",                      // Opcional: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING
  "clientId": "client_id"                // Opcional
}
```

#### 15. create_ticket
Crea un ticket de soporte.

**Arguments:**
```json
{
  "title": "Título del ticket",
  "description": "Descripción detallada",
  "guestName": "Nombre del cliente",
  "guestEmail": "cliente@example.com",
  "category": "SUPPORT",                 // Opcional: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING
  "priority": "MEDIUM",                   // Opcional: LOW, MEDIUM, HIGH, URGENT
  "clientId": "client_id",               // Opcional
  "projectId": "project_id"              // Opcional
}
```

#### 16. update_ticket
Actualiza un ticket.

**Arguments:**
```json
{
  "ticketId": "ticket_id",
  "status": "IN_PROGRESS",     // Opcional: OPEN, IN_PROGRESS, WAITING_CLIENT, RESOLVED, CLOSED
  "priority": "HIGH",            // Opcional: LOW, MEDIUM, HIGH, URGENT
  "category": "BUG"              // Opcional: BUG, FEATURE_REQUEST, QUESTION, SUPPORT, BILLING
}
```

#### 17. delete_ticket
Elimina un ticket ( irreversible).

**Arguments:**
```json
{
  "ticketId": "ticket_id"
}
```

---

### ⏱️ TIEMPO (1 tool)

#### 18. get_project_time_report
Obtiene reporte de tiempo de un proyecto.

**Arguments:**
```json
{
  "projectId": "project_id"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear tarea asignada con fecha límite

```bash
curl -X POST https://crmdev.tech/api/mcp/rest \
  -H "Authorization: Bearer crm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_task",
    "arguments": {
      "title": "Fix login bug",
      "description": "El login no funciona en móvil",
      "assigneeId": "user_abc123",
      "dueDate": "2026-03-15",
      "priority": "HIGH"
    }
  }'
```

### Ejemplo 2: Listar miembros y crear tarea

```bash
# 1. Obtener miembros
curl -X POST https://crmdev.tech/api/mcp/rest \
  -H "Authorization: Bearer crm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool":"list_members","arguments":{}}'

# 2. Crear tarea con assigneeId del paso anterior
curl -X POST https://crmdev.tech/api/mcp/rest \
  -H "Authorization: Bearer crm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_task",
    "arguments": {
      "title": "Revisar PR #123",
      "assigneeId": "user_abc123",
      "projectId": "project_xyz"
    }
  }'
```

### Ejemplo 3: Crear ticket de soporte

```bash
curl -X POST https://crmdev.tech/api/mcp/rest \
  -H "Authorization: Bearer crm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_ticket",
    "arguments": {
      "title": "Error en página de checkout",
      "description": "El carrito no guarda productos",
      "guestName": "María García",
      "guestEmail": "maria@cliente.com",
      "category": "BUG",
      "priority": "HIGH"
    }
  }'
```

---

## Códigos de Error

| Error | Descripción |
|-------|-------------|
| `Unauthorized` | API Key inválida o expirada |
| `Proyecto no encontrado` | El projectId no existe en tu organización |
| `Cliente no encontrado` | El clientId no existe en tu organización |
| `Usuario asignado no es miembro` | El assigneeId no pertenece a tu organización |
| `Tarea no encontrada` | La taskId no existe en tu organización |
| `Ticket no encontrado` | La ticketId no existe en tu organización |

---

## Notas Importantes

- **Multi-tenancia:** Todos los datos están aislados por organización. Una API Key solo accede a datos de su organización.
- **Validación:** La API valida automáticamente que proyectos, clientes y miembros pertenezcan a tu organización antes de crear/modificar.
- **Irreversibles:** Las operaciones de `delete_*` no se pueden deshacer.
- **Fechas:** Usa formato ISO 8601 para fechas: `2026-03-15` o `2026-03-15T14:30:00Z`

---

## Integración con Claude Desktop

Para configurar Claude Desktop, ver: **`CLAUDE_DESKTOP_SETUP.md`**

## Integración con ChatGPT

1. Configura un nuevo "Action" en ChatGPT
2. Endpoint: `https://crmdev.tech/api/mcp/rest`
3. Method: `POST`
4. Headers: `Authorization: Bearer crm_YOUR_KEY`
5. Content-Type: `application/json`

Última actualización: 10/03/2026
