# Configurar Bot de Telegram con n8n para CRMDev

> 📌 **Objetivo**: Controlar tu CRM desde el móvil usando comandos de Telegram

---

## 🎯 Arquitectura

```
Telegram (móvil) → n8n (tu VPS) → CRM REST API (crmdev.tech) → Base de datos
                    ↓
              Respuesta formateada
                    ↓
              Telegram (móvil)
```

---

## 📋 Paso 1: Configurar Telegram en n8n

### 1.1 Crear credenciales de Telegram

1. Entra a tu panel de n8n
2. Ve a **Settings** → **Credentials**
3. Click en **"Add Credential"**
4. Busca **"Telegram API"**
5. Completa:
   - **Access Token**: Tu token del bot (obtenido de @BotFather)
   - Click **"Save"**

> 💡 Si no tienes el token, habla con @BotFather en Telegram y usa `/newbot`

---

## 🔨 Paso 2: Crear el Workflow Principal

### 2.1 Trigger: Telegram Trigger

1. Crea nuevo workflow en n8n
2. Añade nodo **"Telegram Trigger"**
3. Configura:
   - **Event**: `Message Received`
   - **Updates**: `Messages`
4. Conéctalo con tu credencial de Telegram

### 2.2 Switch Router para Comandos

Añade nodo **"Switch"** para manejar diferentes comandos:

```
Telegram Trigger → Switch → [Comandos]
                         ├── /tareas → Listar tareas
                         ├── /crear_tarea → Crear tarea
                         ├── /proyectos → Listar proyectos
                         ├── /crear_proyecto → Crear proyecto
                         ├── /clientes → Listar clientes
                         ├── /crear_cliente → Crear cliente
                         └── default → Mensaje de ayuda
```

**Configuración del Switch:**

```
Field: {{$json["message"]["text"]}}
Type: String
Rules:
- /tareas (listar tareas)
- /crear_tarea (crear tarea)
- /proyectos (listar proyectos)
- /crear_proyecto (crear proyecto)
- /clientes (listar clientes)
- /crear_cliente (crear cliente)
- /help (ayuda)
```

---

## 📝 Paso 3: Ejemplo - Comando /tareas

### Nodo HTTP Request (GET)

```
Method: POST
URL: https://crmdev.tech/api/mcp/rest

Authentication: Generic Credential Type
  - Name: CRM API
  - Header Name: Authorization
  - Header Value: Bearer crm_TU_API_KEY

Body (JSON):
{
  "tool": "list_tasks",
  "arguments": {}
}
```

### Nodo Function (Formatear Respuesta)

```javascript
const items = $input.all();
const response = items[0].json;

if (response.success) {
  const tasks = response.data;

  if (tasks.length === 0) {
    return [{ json: { text: "📋 No tienes tareas pendientes." } }];
  }

  let message = "📋 **Tus Tareas:**\n\n";

  tasks.forEach((task, index) => {
    const emoji = {
      'TODO': '⏳',
      'IN_PROGRESS': '🔄',
      'IN_REVIEW': '👀',
      'DONE': '✅',
      'CANCELLED': '❌'
    }[task.status] || '📌';

    const priority = {
      'LOW': '🟢',
      'MEDIUM': '🟡',
      'HIGH': '🟠',
      'URGENT': '🔴'
    }[task.priority] || '';

    message += `${index + 1}. ${emoji} ${task.title}\n`;
    if (task.description) {
      message += `   📝 ${task.description}\n`;
    }
    message += `   ${priority} Prioridad: ${task.priority}\n\n`;
  });

  return [{ json: { text: message } }];
} else {
  return [{ json: { text: "❌ Error: " + response.error } }];
}
```

### Nodo Telegram (Enviar Respuesta)

```
Resource: Message
Operation: Text
Chat ID: {{$json["message"]["chat"]["id"]}}
Text: {{$json["text"]}}
Parse Mode: Markdown
```

---

## 📝 Paso 4: Ejemplo - Comando /crear_tarea

### Nodo Telegram Trigger (con captura de parámetros)

Para crear una tarea, el usuario enviará:
```
/crear_tarea Llamar a Juan | Prioridad HIGH | Descripción: Discutir propuesta
```

### Nodo Function (Parsear Comando)

```javascript
const text = $json["message"]["text"];
const chatId = $json["message"]["chat"]["id"];

// Remover el comando
let content = text.replace('/crear_tarea', '').trim();

// Parsear parámetros
const parts = content.split('|').map(p => p.trim());

const title = parts[0] || 'Sin título';
let priority = 'MEDIUM';
let description = '';
let projectId = null;

parts.forEach(part => {
  const lower = part.toLowerCase();
  if (lower.includes('prioridad')) {
    const match = part.match(/prioridad\s*:\s*(LOW|MEDIUM|HIGH|URGENT)/i);
    if (match) priority = match[1].toUpperCase();
  } else if (lower.includes('descripción') || lower.includes('descripcion')) {
    description = part.replace(/descripción\s*:\s*|descripcion\s*:\s*/i, '').trim();
  } else if (lower.includes('proyecto')) {
    const match = part.match(/proyecto\s*:\s*(\w+)/i);
    if (match) projectId = match[1];
  }
});

return [{
  json: {
    chatId,
    task: {
      title,
      priority,
      description,
      projectId
    }
  }
}];
```

### Nodo HTTP Request (POST a CRM)

```
Method: POST
URL: https://crmdev.tech/api/mcp/rest

Headers:
  Content-Type: application/json
  Authorization: Bearer crm_TU_API_KEY

Body (JSON Expression):
{
  "tool": "create_task",
  "arguments": {
    "title": "{{$json["task"]["title"]}}",
    "priority": "{{$json["task"]["priority"]}}",
    "description": "{{$json["task"]["description"]}}",
    "projectId": "{{$json["task"]["projectId"]}}"
  }
}
```

### Nodo Function (Confirmación)

```javascript
const response = $input.all()[0].json;

if (response.success) {
  const task = response.data;
  return [{
    json: {
      text: `✅ **Tarea Creada**\n\n📌 ${task.title}\n🔑 ID: ${task.id}\n⚡ Prioridad: ${task.priority}`
    }
  }];
} else {
  return [{
    json: {
      text: `❌ Error al crear tarea: ${response.error}`
    }
  }];
}
```

---

## 🎯 Todos los Comandos Disponibles

### Listar

| Comando | Tool | Argumentos |
|---------|------|------------|
| `/tareas` | `list_tasks` | `limit`, `status`, `projectId` |
| `/proyectos` | `list_projects` | `limit`, `status` |
| `/clientes` | `list_clients` | `limit`, `status` |

### Crear

| Comando | Tool | Argumentos |
|---------|------|------------|
| `/crear_tarea` | `create_task` | `title`, `description`, `priority`, `projectId` |
| `/crear_proyecto` | `create_project` | `name`, `description`, `type` |
| `/crear_cliente` | `create_client` | `name`, `email`, `company`, `status` |

### Actualizar

| Comando | Tool | Argumentos |
|---------|------|------------|
| `/actualizar_tarea` | `update_task` | `taskId`, `title`, `status`, `priority` |
| `/actualizar_proyecto` | `update_project` | `projectId`, `name`, `status`, `progress` |
| `/actualizar_cliente` | `update_client` | `clientId`, `name`, `status` |

### Eliminar

| Comando | Tool | Argumentos |
|---------|------|------------|
| `/borrar_tarea` | `delete_task` | `taskId` |
| `/borrar_proyecto` | `delete_project` | `projectId` |
| `/borrar_cliente` | `delete_client` | `clientId` |

---

## 📱 Ejemplos de Uso desde Móvil

```
/tareas
→ Muestra todas tus tareas

/tareas IN_PROGRESS
→ Solo tareas en progreso

/crear_tarea Revisar PR | Prioridad URGENT
→ Crea tarea urgente "Revisar PR"

/crear_proyecto Tienda Online | Type WORDPRESS
→ Crea proyecto de WordPress

/crear_client Juan Pérez | Email: juan@empresa.com
→ Crea cliente con email

/actualizar_tarea task_123 | Status DONE
→ Marca tarea como completada

/proyectos
→ Lista todos tus proyectos

/clientes
→ Lista todos tus clientes
```

---

## 🔒 Seguridad

### Guardar API Key en Credenciales n8n

En lugar de poner la API Key en cada nodo, créala como credencial:

1. **Settings** → **Credentials** → **Add Credential**
2. **Header Auth**
3. **Name**: `CRM API`
4. **Name**: `Authorization`
5. **Value**: `Bearer crm_TU_API_KEY`

Luego en los nodos HTTP Request, selecciona esta credencial.

---

## 🚀 Tips Avanzados

### 1. Respuestas con botones (Inline Keyboards)

Usa el nodo **"Telegram"** con operación **"SendMessage"** y añade:
```json
{
  "reply_markup": {
    "inline_keyboard": [
      [{"text": "✅ Marcar Done", "callback_data": "done_task_123"}],
      [{"text": "🗑️ Eliminar", "callback_data": "delete_task_123"}]
    ]
  }
}
```

### 2. Callback Queries para acciones rápidas

Añade otro trigger **"Telegram Trigger"** con evento **"Callback Query Received"** para manejar clicks en botones.

### 3. Comando /help personalizado

```javascript
// En el nodo Function para /help
return [{
  json: {
    text: `🤖 *Comandos Disponibles*

📋 *Listar:*
/tareas - Ver todas las tareas
/proyectos - Ver proyectos
/clientes - Ver clientes

✨ *Crear:*
/crear_tarea Título | Prioridad HIGH
/crear_proyecto Nombre | Type WORDPRESS
/crear_client Nombre | Email: email@ejemplo.com

🔄 *Actualizar:*
/actualizar_tarea ID | Status DONE
/actualizar_proyecto ID | Progress 50

❓ *Ayuda:*
/help - Ver este mensaje

💡 *Ejemplo:*
/crear_tarea Llamar a cliente | Prioridad URGENT`
  }
}];
```

---

## 🧪 Testing

1. Activa el workflow en n8n
2. Ve a tu bot en Telegram: @lumicaweb_bot
3. Envía `/help` para ver los comandos
4. Prueba `/proyectos`
5. Prueba `/crear_tarea Test desde Telegram`

---

## 📊 Resumen de Endpoints

| URL | Método | Propósito |
|-----|--------|-----------|
| `https://crmdev.tech/api/mcp/rest` | POST | Ejecutar cualquier tool MCP |
| `https://crmdev.tech/api/mcp/install` | GET | Descargar instalador (futuro) |

---

## 🎁 Bonus: Integración con ChatGPT

Si quieres usar ChatGPT en lugar de Telegram, puedes crear un **GPT** personalizado:

1. Ve a https://chat.openai.com
2. Crea un nuevo **GPT**
3. En **Actions**, configura:
   ```yaml
   openapi: 3.0.0
   info:
     title: CRMDev API
     version: 1.0.0
   servers:
     - url: https://crmdev.tech/api/mcp/rest
   paths:
     /:
       post:
         operationId: executeTool
         parameters:
           - name: tool
             in: body
             required: true
             schema:
               type: object
               properties:
                 tool:
                   type: string
                 arguments:
                   type: object
         security:
           - bearerAuth: []
   components:
     securitySchemes:
       bearerAuth:
         type: http
         scheme: bearer
   ```
4. Añade tu API Key en **Authentication**
5. ¡Ahora ChatGPT puede gestionar tu CRM!

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que la API Key sea válida en https://crmdev.tech/settings/api-keys
2. Revisa los logs de n8n
3. Testea el endpoint REST con curl:
   ```bash
   curl -X POST https://crmdev.tech/api/mcp/rest \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer crm_TU_API_KEY" \
     -d '{"tool": "list_projects", "arguments": {}}'
   ```
