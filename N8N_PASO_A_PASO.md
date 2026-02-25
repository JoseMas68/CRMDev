# Configurar Bot Telegram en n8n - Paso a Paso

> Opción más fácil: Crear el workflow manualmente

---

## Paso 1: Crear Credencial de Telegram

1. En n8n, ve a **Settings** → **Credentials**
2. Click **"Add Credential"**
3. Busca **"Telegram API"**
4. Pon tu **Access Token** de @BotFather
5. Guarda como "Telegram Bot"

---

## Paso 2: Crear el Workflow

### 2.1 Nodo Telegram Trigger

1. Click **"+"** para añadir nodo
2. Busca **"Telegram Trigger"**
3. Selecciona tu credencial
4. En **Updates**, marca **"Messages"**
5. Guarda

### 2.2 Nodo Switch (para comandos)

1. Añade nodo **"Switch"**
2. Configura:
   - **Field**: `{{ $json.message.text }}`
   - **Type**: String
   - **Rules** (añade 7 reglas):

| Output | Condition | Value |
|--------|-----------|-------|
| Output 1 | Equals | `/tareas` |
| Output 2 | Equals | `/crear_tarea` |
| Output 3 | Equals | `/proyectos` |
| Output 4 | Equals | `/crear_proyecto` |
| Output 5 | Equals | `/clientes` |
| Output 6 | Equals | `/crear_cliente` |
| Output 7 | Equals | `/help` |

---

## Paso 3: Crear los comandos de LISTAR

### 3.1 Comando /tareas

Añade nodo **"HTTP Request"** conectado al Output 1 del Switch:

```
Name: List Tareas
Method: POST
URL: https://crmdev.tech/api/mcp/rest

Authentication: None
Headers (Add 2):
  - Content-Type = application/json
  - Authorization = Bearer crm_TU_API_KEY

Body:
  Content Type = JSON
  Body = {
    "tool": "list_tasks",
    "arguments": {}
  }
```

Añade nodo **"Code"** después del HTTP Request:

```javascript
const result = $input.item.json;

if (result.success && result.data && result.data.length > 0) {
  let message = '📋 **Tus Tareas:**\n\n';

  result.data.forEach((task, i) => {
    const emojis = {
      'TODO': '⏳',
      'IN_PROGRESS': '🔄',
      'IN_REVIEW': '👀',
      'DONE': '✅',
      'CANCELLED': '❌'
    };
    const priorities = {
      'LOW': '🟢',
      'MEDIUM': '🟡',
      'HIGH': '🟠',
      'URGENT': '🔴'
    };
    const emoji = emojis[task.status] || '📌';
    const priority = priorities[task.priority] || '';

    message += `${i + 1}. ${emoji} ${task.title}\n`;
    if (task.description) {
      message += `   📝 ${task.description}\n`;
    }
    message += `   ${priority} ${task.priority}\n\n`;
  });

  return { json: { message: message, chat_id: $('Telegram Trigger').item.json.message.chat.id } };
} else {
  return { json: { message: '📋 No tienes tareas pendientes.', chat_id: $('Telegram Trigger').item.json.message.chat.id } };
}
```

### 3.2 Comando /proyectos

Añade nodo **"HTTP Request"** conectado al Output 3 del Switch:

```
Name: List Proyectos
Method: POST
URL: https://crmdev.tech/api/mcp/rest

Headers:
  - Content-Type = application/json
  - Authorization = Bearer crm_TU_API_KEY

Body = {
  "tool": "list_projects",
  "arguments": {}
}
```

Añade nodo **"Code"** después:

```javascript
const result = $input.item.json;

if (result.success && result.data && result.data.length > 0) {
  let message = '🚀 **Tus Proyectos:**\n\n';

  result.data.forEach((project, i) => {
    const emojis = {
      'NOT_STARTED': '⬜',
      'IN_PROGRESS': '🔄',
      'ON_HOLD': '⏸️',
      'COMPLETED': '✅',
      'CANCELLED': '❌'
    };
    const emoji = emojis[project.status] || '📌';

    message += `${i + 1}. ${emoji} ${project.name}\n`;
    message += `   📊 Progreso: ${project.progress}%\n`;
    message += `   🏷️ ${project.type}\n\n`;
  });

  return { json: { message: message, chat_id: $('Telegram Trigger').item.json.message.chat.id } };
} else {
  return { json: { message: '🚀 No tienes proyectos.', chat_id: $('Telegram Trigger').item.json.message.chat.id } };
}
```

### 3.3 Comando /clientes

Añade nodo **"HTTP Request"** conectado al Output 5 del Switch:

```
Name: List Clientes
Method: POST
URL: https://crmdev.tech/api/mcp/rest

Body = {
  "tool": "list_clients",
  "arguments": {}
}
```

Añade nodo **"Code"** después:

```javascript
const result = $input.item.json;

if (result.success && result.data && result.data.length > 0) {
  let message = '👥 **Tus Clientes:**\n\n';

  result.data.forEach((client, i) => {
    const emojis = {
      'LEAD': '🔵',
      'PROSPECT': '🟡',
      'CUSTOMER': '🟢',
      'INACTIVE': '⚪',
      'CHURNED': '🔴'
    };
    const emoji = emojis[client.status] || '👤';

    message += `${i + 1}. ${emoji} ${client.name}\n`;
    if (client.email) message += `   📧 ${client.email}\n`;
    if (client.company) message += `   🏢 ${client.company}\n`;
    message += `   📊 ${client.status}\n\n`;
  });

  return { json: { message: message, chat_id: $('Telegram Trigger').item.json.message.chat.id } };
} else {
  return { json: { message: '👥 No tienes clientes.', chat_id: $('Telegram Trigger').item.json.message.chat.id } };
}
```

---

## Paso 4: Unir todas las respuestas

### Nodo Telegram para enviar respuesta

Añade nodo **"Telegram"**:

```
Resource: Message
Operation: Text
Chat ID: {{ $json.chat_id }}
Text: {{ $json.message }}
```

Conecta TODOS los nodos "Code" a este mismo nodo "Telegram".

---

## Paso 5: Comandos de CREAR (Opcional)

### /crear_tarea

Añade nodo **"Code"** conectado al Output 2 del Switch:

```javascript
const text = $('Telegram Trigger').item.json.message.text;
let content = text.replace('/crear_tarea', '').trim();

const parts = content.split('|').map(p => p.trim());
const title = parts[0] || 'Sin título';
let priority = 'MEDIUM';
let description = '';

parts.forEach(part => {
  const lower = part.toLowerCase();
  if (lower.includes('prioridad')) {
    const match = part.match(/prioridad\s*:\s*(LOW|MEDIUM|HIGH|URGENT)/i);
    if (match) priority = match[1].toUpperCase();
  } else if (lower.includes('descripción') || lower.includes('descripcion')) {
    description = part.replace(/descripción\s*:\s*|descripcion\s*:\s*/i, '').trim();
  }
});

return { json: { title, priority, description, chat_id: $('Telegram Trigger').item.json.message.chat.id } };
```

Añade nodo **"HTTP Request"** después:

```
Method: POST
URL: https://crmdev.tech/api/mcp/rest
Body = {
  "tool": "create_task",
  "arguments": {
    "title": "{{ $json.title }}",
    "priority": "{{ $json.priority }}",
    "description": "{{ $json.description }}"
  }
}
```

Añade nodo **"Code"** para formatear respuesta:

```javascript
const result = $input.item.json;
const chat_id = $('Code').item.json.chat_id;

if (result.success) {
  return { json: { message: `✅ **Tarea Creada**\n\n📌 ${$('Code').item.json.title}\n⚡ Prioridad: ${$('Code').item.json.priority}`, chat_id } };
} else {
  return { json: { message: `❌ Error: ${result.error}`, chat_id } };
}
```

Conecta al nodo **"Telegram"** de respuesta.

---

## Paso 6: Comando /help

Añade nodo **"Code"** conectado al Output 7 del Switch:

```javascript
return { json: {
  message: `🤖 **Comandos Disponibles**

📋 **Listar:**
/tareas - Ver todas las tareas
/proyectos - Ver proyectos
/clientes - Ver clientes

✨ **Crear:**
/crear_tarea Título | Prioridad HIGH
/crear_proyecto Nombre | Type WORDPRESS
/crear_cliente Nombre | Email: email@ejemplo.com

❓ **Ayuda:**
/help - Ver este mensaje

💡 **Ejemplo:**
/crear_tarea Llamar a cliente | Prioridad URGENT`,
  chat_id: $('Telegram Trigger').item.json.message.chat.id
}};
```

Conecta al nodo **"Telegram"** de respuesta.

---

## Paso 7: Activar

1. Click **"Save"** (guardar workflow)
2. Click en **"Active"** toggle (activar)
3. Ve a tu bot en Telegram: @lumicaweb_bot
4. Envía `/help` para probar

---

## Comandos disponibles al final:

```
/tareas                    - Ver todas las tareas
/proyectos                 - Ver proyectos
/clientes                  - Ver clientes
/crear_tarea Título | Prioridad HIGH
/crear_proyecto Nombre | Type WORDPRESS
/crear_cliente Nombre | Email: x@y.com
/help                      - Ver ayuda
```

---

## Troubleshooting

### Error "Could not establish connection"
- Es normal, ignóralo. Es el navegador intentando conectarse a extensiones.

### El bot no responde
- Verifica que el workflow esté **Active** (toggle en verde)
- Verifica tu **Access Token** de Telegram
- Revisa la pestaña **"Executions"** para ver errores

### Error 401 Unauthorized
- Verifica que la API Key sea correcta
- Revisa el header Authorization: `Bearer crm_TU_API_KEY`

### Las tareas se crean pero falla
- Espera a que termine el deploy del código arreglado
- El problema del `creatorId` estaba arreglado en el último commit
