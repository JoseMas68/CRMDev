# Ticket Webhook (Beta)

Este endpoint permite recibir tickets desde los sitios/formularios de tus clientes y registrarlos automáticamente en CRMDev.

## Endpoint

```
POST https://crmdev.tech/api/webhooks/tickets
```

## Payload

| Campo          | Tipo     | Requerido | Descripción |
|----------------|----------|-----------|-------------|
| `secret`       | string   | ✅        | Token del proyecto (o `TICKET_WEBHOOK_SECRET` global) |
| `projectId`    | string   | ✅        | ID del proyecto en CRMDev |
| `subject`      | string   | ✅        | Título / asunto del ticket |
| `description`  | string   | ✅        | Descripción completa (se admite HTML/Markdown) |
| `contactName`  | string   |          | Nombre del remitente |
| `contactEmail` | string   |          | Email del remitente |
| `priority`     | string   |          | `low`, `medium`, `high`, `urgent` (default `MEDIUM`) |
| `category`     | string   |          | `bug`, `feature`, `question`, etc. (default `OTHER`) |
| `attachments`  | string[] |          | Array de URLs a evidencias (Drive, S3, etc.) |
| `clientId`     | string   |          | ID del cliente en CRMDev (si difiere del `project.clientId`) |

## Respuesta

```json
{
  "success": true,
  "data": {
    "id": "tick_123",
    "status": "OPEN"
  }
}
```

## Ejemplo de formulario embebido

```html
<form action="https://crmdev.tech/api/webhooks/tickets" method="POST" target="_blank">
  <input type="hidden" name="secret" value="TU_TOKEN" />
  <input type="hidden" name="projectId" value="PROJECT_ID" />
  <label>
    Tu nombre
    <input type="text" name="contactName" required />
  </label>
  <label>
    Email
    <input type="email" name="contactEmail" required />
  </label>
  <label>
    Asunto
    <input type="text" name="subject" required />
  </label>
  <label>
    Descripción
    <textarea name="description" rows="5" required></textarea>
  </label>
  <button type="submit">Enviar ticket</button>
</form>
```

> **Nota:** para sitios estáticos, conviene enviar el formulario mediante `fetch`/AJAX para no exponer el `secret`. En ese caso, haz la petición desde un worker/edge function propio.

## Próximos pasos
- UI para generar/rotar `ticketWebhookSecret` por proyecto.
- Automatización (AI/PR) tras la creación del ticket.
- Respuestas automáticas al cliente.
