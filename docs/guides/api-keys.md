# Guía de API Keys para Integraciones MCP

## ¿Qué son las API Keys?

Las API Keys en CRMPro permiten integrar el CRM con asistentes de IA (Claude Desktop, ChatGPT, etc.) mediante el protocolo **MCP (Model Context Protocol)**.

**Características importantes:**
- ✅ **Una API Key por organización** - Cada organización tiene sus propias keys
- ✅ **Aislamiento de datos** - Cada key solo accede a datos de su organización
- ✅ **Multi-usuario** - Cada usuario puede crear sus propias API Keys
- ✅ **Revocables** - Puedes revocar y regenerar keys en cualquier momento
- ✅ **Auditables** - Registro de último uso de cada key

## Crear una API Key

### Paso 1: Navegar a Configuración

1. Entra a CRMPro (https://crmdev.tech o tu dominio)
2. Ve a **Settings** (icono de engranaje)
3. Selecciona **API Keys** en el menú lateral

### Paso 2: Crear Nueva Key

1. Click en **"Crear nueva API Key"**
2. Ponle un nombre descriptivo, ej:
   - "Claude Desktop - Mi Laptop"
   - "ChatGPT Integration"
   - "Script de Automatización"
3. Click en **"Crear"**
4. **COPIA LA KEY INMEDIATAMENTE** - Solo se muestra una vez

Formato de la key:
```
crm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Usar tu API Key

### Opción 1: Claude Desktop (Recomendado)

Usa el instalador automático:

```bash
curl -sSL https://crmdev.tech/api/mcp/install | node - TU_API_KEY
```

**Ejemplo:**
```bash
curl -sSL https://crmdev.tech/api/mcp/install | node - crm_abc123xyz456
```

Luego reinicia Claude Desktop y podrás usar comandos como:
- "¿Qué proyectos tengo?"
- "Crea una tarea urgente: Llamar a cliente"
- "Lista todos mis clientes con status LEAD"

Ver [Guía completa de Claude Desktop](./claude-desktop-setup.md) para más detalles.

### Opción 2: API REST Directa

Puedes hacer requests HTTP directas al endpoint REST:

```bash
curl -X POST https://crmdev.tech/api/mcp/rest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_API_KEY" \
  -d '{
    "tool": "list_projects",
    "arguments": {}
  }'
```

**Ejemplo con Node.js:**
```javascript
const response = await fetch('https://crmdev.tech/api/mcp/rest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer crm_TU_API_KEY',
  },
  body: JSON.stringify({
    tool: 'list_projects',
    arguments: {},
  }),
});

const data = await response.json();
console.log(data);
```

**Ejemplo con Python:**
```python
import requests

response = requests.post(
    'https://crmdev.tech/api/mcp/rest',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer crm_TU_API_KEY',
    },
    json={
        'tool': 'list_projects',
        'arguments': {},
    },
)

data = response.json()
print(data)
```

## Herramientas Disponibles

### Proyectos

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `list_projects` | Listar proyectos | `limit?: number`, `status?: ProjectStatus` |
| `create_project` | Crear proyecto | `name: string`, `description?: string`, `type?: ProjectType` |
| `update_project` | Actualizar proyecto | `projectId: string`, `name?: string`, `status?: ProjectStatus` |
| `delete_project` | Eliminar proyecto | `projectId: string` |

### Tareas

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `list_tasks` | Listar tareas | `limit?: number`, `projectId?: string`, `status?: TaskStatus` |
| `create_task` | Crear tarea | `title: string`, `description?: string`, `priority?: TaskPriority` |
| `update_task` | Actualizar tarea | `taskId: string`, `title?: string`, `status?: TaskStatus` |
| `delete_task` | Eliminar tarea | `taskId: string` |

### Clientes

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `list_clients` | Listar clientes | `limit?: number`, `status?: ClientStatus` |
| `create_client` | Crear cliente | `name: string`, `email?: string`, `company?: string` |
| `update_client` | Actualizar cliente | `clientId: string`, `name?: string`, `status?: ClientStatus` |
| `delete_client` | Eliminar cliente | `clientId: string` |

### Time Tracking

| Herramienta | Descripción | Parámetros |
|-------------|-------------|------------|
| `get_project_time_report` | Reporte de tiempos | `projectId: string` |

## Gestionar tus API Keys

### Ver tus Keys

En **Settings → API Keys** verás:

| Nombre | Key | Creada por | Último uso | Acciones |
|--------|-----|------------|------------|----------|
| Claude Desktop | crm_***...xyz | Tú | 2026-03-10 10:30 | 🔴 Revocar |
| Script Python | crm_***...abc | Tú | 2026-03-09 15:20 | 🔴 Revocar |

### Revocar una Key

1. Ve a **Settings → API Keys**
2. Encuentra la key que quieres revocar
3. Click en **"Revocar"**
4. Confirma la acción

**⚠️ Importante:** Al revocar una key, cualquier integración que la use dejará de funcionar inmediatamente.

### Regenerar una Key

Si necesitas una key nueva:

1. Revoca la key anterior
2. Crea una nueva key
3. Actualiza tus integraciones con la nueva key

## Seguridad de las API Keys

### ✅ Buenas Prácticas

1. **Nombra tus keys** con algo descriptivo
   - ✅ "Claude Desktop - MacBook Pro"
   - ✅ "Script de Backup - Servidor 1"
   - ❌ "Key 1" o "Mi key"

2. **Usa keys diferentes** para diferentes integraciones
   - Una key para Claude Desktop
   - Otra key para scripts de automatización
   - Otra key para desarrollo

3. **Revoca keys periódicamente**
   - Cada 3-6 meses
   - Cuando sospeches de uso no autorizado
   - Cuando un empleado deje la empresa

4. **Monitorea el uso**
   - Revisa "Último uso" regularmente
   - Si ves actividad sospechosa, revoca inmediatamente

5. **Nunca compartas tus keys**
   - ❌ No las commits en Git
   - ❌ No las envíes por email/chat
   - ❌ No las pongas en código público

### ❌ Qué NO Hacer

1. **NO exponer tu key en código público**
   ```javascript
   // ❌ INCORRECTO
   const API_KEY = "crm_abc123xyz"; // Visible en GitHub

   // ✅ CORRECTO
   const API_KEY = process.env.CRM_API_KEY; // En variable de entorno
   ```

2. **NO usar la misma key en múltiples lugares**
   - Si una key es comprometida, solo afecta una integración

3. **NO olvidar revocar keys antiguas**
   - Las keys antiguas son vectores de ataque

## Solución de Problemas

### Error: "Invalid API Key"

**Causas posibles:**
1. La key está mal escrita
2. La key fue revocada
3. La key no pertenece a esta organización

**Solución:**
1. Verifica que la key esté completa (incluye `crm_` al inicio)
2. Ve a Settings → API Keys y verifica que la key esté activa
3. Si no funciona, crea una nueva key

### Error: "Unauthorized"

**Causa:** La key es válida pero no tienes permisos para la operación.

**Solución:**
1. Verifica que tu usuario tenga el rol adecuado (admin/owner)
2. Algunas operaciones requieren permisos especiales

### Error: "Organization not found"

**Causa:** La key pertenece a una organización que no existe o fue eliminada.

**Solución:**
1. Verifica que estás en la organización correcta
2. Contacta al dueño de la organización

## Ejemplos de Integración

### Integración con Scripts de Automatización

```javascript
// backup-tasks.js
const API_KEY = process.env.CRM_API_KEY;

async function backupTasks() {
  const response = await fetch('https://crmdev.tech/api/mcp/rest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      tool: 'list_tasks',
      arguments: { limit: 1000 },
    }),
  });

  const { data } = await response.json();

  // Guardar en archivo
  fs.writeFileSync('tasks-backup.json', JSON.stringify(data, null, 2));
}

backupTasks();
```

### Integración con Zapier/Make

1. Crea un nuevo Zap/Scenario
2. Añade un step "Webhooks" → "POST"
3. URL: `https://crmdev.tech/api/mcp/rest`
4. Headers:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer crm_TU_API_KEY`
5. Body:
   ```json
   {
     "tool": "create_client",
     "arguments": {
       "name": "{{NameFromTrigger}}",
       "email": "{{EmailFromTrigger}}"
     }
   }
   ```

## Referencias

- [Arquitectura MCP](../architecture/mcp-integration.md) - Detalles técnicos de la integración
- [Guía Claude Desktop](./claude-desktop-setup.md) - Configuración de Claude Desktop
- [Documentación API MCP](../architecture/mcp-integration.md#herramientas-disponibles) - Lista completa de herramientas
