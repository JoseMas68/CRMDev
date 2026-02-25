# Telegram Multi-Tenant para CRMDev - Guía Completa

> 🚀 **SaaS-ready**: Un solo bot de Telegram atiende a todos los tenants

---

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     BOT TELEGRAM (Único)                    │
│                   @tucrm_bot (ejemplo)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────┐
                │  n8n (VPS)  │
                └──────┬──────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  ¿Mensaje es "/start TG-XXX"? │
        └──────────┬───────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
        SÍ                  NO
         │                   │
         ▼                   ▼
  POST /api/telegram/link    GET /api/telegram/resolve/:userId
         │                   │
         ▼                   ▼
  Vincular usuario     Obtener API key del tenant
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
        POST /api/mcp/rest (con API key dinámica)
                   │
                   ▼
          Base de Datos (Tenant aislado)
```

---

## 🗄️ Endpoints de la API CRM

### 1. Generar Token de Vinculación

**Para:** Usuario en el dashboard del CRM

```http
POST https://crmdev.tech/api/telegram/generate-token
Authorization: Bearer <session_cookie>
```

**Respuesta:**
```json
{
  "token": "TG-A1B2C3D4",
  "expires_in": 600,
  "message": "Use este token en Telegram: /start TG-A1B2C3D4"
}
```

### 2. Vincular Usuario de Telegram

**Para:** n8n workflow (cuando usuario escribe `/start TG-XXX`)

```http
POST https://crmdev.tech/api/telegram/link
Content-Type: application/json

{
  "token": "TG-A1B2C3D4",
  "telegramUserId": 123456789,
  "telegramUsername": "juanperez",
  "telegramChatId": 123456789
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Conectado correctamente",
  "organization": "Mi Empresa SL"
}
```

### 3. Resolver API Key (Multi-tenant)

**Para:** n8n workflow (para cada mensaje de usuario vinculado)

```http
GET https://crmdev.tech/api/telegram/resolve/123456789
```

**Respuesta:**
```json
{
  "organization": {
    "id": "cm123abc",
    "name": "Mi Empresa SL",
    "slug": "mi-empresa"
  },
  "api_key": "crm_xxxxxxxxxxxxx",
  "telegram_username": "juanperez"
}
```

---

## 🔨 Workflow n8n - Paso a Paso

### Paso 1: Telegram Trigger

```
Nodo: Telegram Trigger
Credencial: Tu Telegram Bot (@BotFather)
Updates: Messages
```

### Paso 2: IF - Comprobar si es comando /start

```
Nodo: IF
Condición:
  Campo: {{ $json.message.text }}
  Operación: Starts With
  Valor: "/start TG-"
```

### Paso 3: Rama TRUE - Vincular Usuario

#### 3.1 Extraer token del mensaje

```
Nodo: Code
Nombre: Extract Token

Código:
const text = $json.message.text;
const token = text.split('/start ')[1];
return {
  json: {
    token: token,
    telegramUserId: $json.message.from.id,
    telegramUsername: $json.message.from.username,
    telegramChatId: $json.message.chat.id
  }
};
```

#### 3.2 Llamar endpoint link

```
Nodo: HTTP Request
Nombre: Link Telegram
Method: POST
URL: https://crmdev.tech/api/telegram/link
Body (JSON):
{
  "token": "={{ $json.token }}",
  "telegramUserId": "={{ $json.telegramUserId }}",
  "telegramUsername": "={{ $json.telegramUsername }}",
  "telegramChatId": "={{ $json.telegramChatId }}"
}
```

#### 3.3 Enviar confirmación

```
Nodo: Telegram
Resource: Message
Operation: Text
Chat ID: {{ $json.telegramChatId }}
Text:
✅ *Conectado correctamente*
Organización: {{ $json.organization }}
```

### Paso 4: Rama FALSE - Flujo Normal

#### 4.1 Resolver API Key

```
Nodo: HTTP Request
Nombre: Resolve API Key
Method: GET
URL: https://crmdev.tech/api/telegram/resolve/{{ $json.message.from.id }}
```

#### 4.2 Manejar errores

```
Nodo: IF
Nombre: Check Linked
Condición:
  Campo: {{ $json.error }}
  Operación: Exists
```

**Si hay error → Enviar mensaje:**
```
❌ No estás vinculado.
Usa /start TG-TOKEN para conectar tu cuenta.
```

**Si no hay error → Continuar**

#### 4.3 Switch de Comandos

```
Nodo: Switch
Field: {{ $json.message.text }}
Type: String
Rules:
- /tareas → Output 1
- /crear_tarea → Output 2
- /proyectos → Output 3
- /help → Output 4
```

#### 4.4 Ejemplo: Listar Tareas

```
Nodo: HTTP Request
Method: POST
URL: https://crmdev.tech/api/mcp/rest
Headers:
  Content-Type: application/json
  Authorization: Bearer {{ $('Resolve API Key').item.json.api_key }}
Body:
{
  "tool": "list_tasks",
  "arguments": {}
}
```

```
Nodo: Code (formatear respuesta)
const result = $json;
if (result.success && result.data.length > 0) {
  let msg = '📋 *Tus Tareas:*\n\n';
  result.data.forEach((t, i) => {
    msg += `${i+1}. ${t.title}\n`;
  });
  return { json: { message: msg } };
}
```

```
Nodo: Telegram (enviar respuesta)
Chat ID: {{ $json.message.chat.id }}
Text: {{ $json.message }}
```

---

## 🎯 UI del Dashboard (Frontend)

### Página: Settings → Telegram

```tsx
// src/app/settings/telegram/page.tsx

"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function TelegramSettings() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/telegram/generate-token");
      setToken(res.data.token);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Conectar Telegram</h1>

      {!token ? (
        <button onClick={generateToken} disabled={loading}>
          {loading ? "Generando..." : "Generar Código de Vinculación"}
        </button>
      ) : (
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="font-bold">Tu código:</h2>
          <code className="text-2xl">{token}</code>
          <p className="mt-2">
            1. Abre tu bot de Telegram: <strong>@tucrm_bot</strong>
            <br />
            2. Escribe: <code>/start {token}</code>
            <br />
            3. ¡Listo! Tu cuenta estará vinculada.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Este código expira en 10 minutos.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 Seguridad

### ✅ Implementado

- **Tokens temporales**: Expiran en 10 minutos
- **Tokens de un solo uso**: Se marcan como `used`
- **Validación de formato**: `TG-XXXXX` con regex
- **Aislamiento de tenants**: Cada API key solo accede a su organización
- **BigInt para IDs**: Telegram user IDs pueden ser muy grandes

### 📋 Mejoras futuras

- [ ] Rate limiting en endpoints de Telegram
- [ ] Logs de actividad (quién se vinculó cuándo)
- [ ] Desvincular desde el dashboard
- [ ] Múltiples conexiones por organización (varios usuarios)
- [ ] Webhook secreto para validar requests desde n8n

---

## 🚀 Despliegue

### 1. Push del schema

```bash
pnpm db:push
```

### 2. Configurar bot en n8n

1. Importar workflow (ver archivo JSON)
2. Configurar credenciales de Telegram
3. Activar workflow

### 3. Configurar webhook del bot

Opción A - Desde n8n (automático):
- n8n configura el webhook automáticamente

Opción B - Manual:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://tu-n8n.com/webhook/telegram"
```

---

## 📱 Flujo Completo del Usuario

```
Usuario (Empresa A)                Usuario (Empresa B)
      │                                   │
      │ 1. Entra a Settings                │
      │ 2. Click "Conectar Telegram"       │
      │ 3. Obtiene: TG-A1B2C3D4            │
      │                                   │
      │ 4. Va al bot @tucrm_bot            │
      │ 5. Escribe: /start TG-A1B2C3D4    │
      │    ✅ Vinculado!                  │
      │                                   │
      │ 6. Escribe: /tareas               │ 6. Escribe: /tareas
      │    → Ve SUS tareas                │    → Ve SUS tareas
      │    (Empresa A)                    │    (Empresa B)
```

**Resultado**: Un solo bot, datos perfectamente aislados por organización.

---

## 🎁 Bonus - Características Pro

### Enviar mensajes desde el CRM a Telegram

```typescript
// Server action
export async function sendTelegramNotification({
  organizationId,
  message
}: {
  organizationId: string;
  message: string;
}) {
  const connections = await prisma.telegramConnection.findMany({
    where: { organizationId, isActive: true },
  });

  for (const conn of connections) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: conn.telegramChatId,
        text: message,
      }),
    });
  }
}
```

### Usos:
- ✅ Recordatorios de tareas vencidas
- ✅ Notificaciones de nuevos clientes
- ✅ Alertas de proyectos actualizados
- ✅ Reportes diarios/semanales

---

## 📊 Monitoreo

### Métricas clave:

- **Total de organizaciones conectadas**: `SELECT COUNT(DISTINCT organizationId) FROM telegram_connections WHERE isActive = true`
- **Total de usuarios de Telegram**: `SELECT COUNT(*) FROM telegram_connections WHERE isActive = true`
- **Vinculaciones hoy**: `SELECT COUNT(*) FROM telegram_connections WHERE DATE(linkedAt) = TODAY()`
- **Tokens usados vs expirados**: Métrica de conversión

---

## 🎯 Checklist para Producción

- [ ] Schema actualizado en producción (`pnpm db:push`)
- [ ] Bot de Telegram creado en @BotFather
- [ ] Token del bot guardado en n8n credentials
- [ ] Workflow n8n importado y activado
- [ ] Webhook configurado correctamente
- [ ] Dashboard UI implementado
- [ ] Test de flujo completo (generar token → vincular → usar comandos)
- [ ] Documentación para usuarios finales

---

## 🆘 Troubleshooting

### El bot no responde
1. Verifica que el workflow n8n esté **Active**
2. Revisa las **Executions** en n8n
3. Verifica el webhook de Telegram: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Error "Token expired"
1. El token dura 10 minutos
2. Genera un nuevo token desde el dashboard

### Error "not_linked"
1. El usuario de Telegram no está vinculado
2. Debe usar `/start TG-TOKEN` primero

### La API key no funciona
1. Verifica que la organización tenga una API key activa
2. Revisa Settings → API Keys en el CRM

---

## 📚 Archivos Relacionados

- **Schema**: [prisma/schema.prisma](../../prisma/schema.prisma) - Modelos `TelegramLinkToken` y `TelegramConnection`
- **Endpoint generate**: [src/app/api/telegram/generate-token/route.ts](../../src/app/api/telegram/generate-token/route.ts)
- **Endpoint link**: [src/app/api/telegram/link/route.ts](../../src/app/api/telegram/link/route.ts)
- **Endpoint resolve**: [src/app/api/telegram/resolve/[telegramUserId]/route.ts](../../src/app/api/telegram/resolve/[telegramUserId]/route.ts)
- **Workflow n8n**: [n8n-telegram-saas.json](./n8n-telegram-saas.json)

---

> 💡 **Próximo nivel**: Añadir soporte de voz con Whisper AI
> Después del Telegram Trigger, si `message.voice` existe:
> 1. Descargar audio
> 2. Transcribir con Whisper API
> 3. Reemplazar `message.text` con transcripción
> 4. El resto del flujo no cambia 🎙️
