# Importar Workflow de n8n para CRMDev

## Pasos:

1. **Abre n8n** en tu panel

2. **Importa el workflow:**
   - Click en "Import from File" o "Importar desde archivo"
   - Selecciona `n8n-crm-workflow.json`
   - Click en "Import"

3. **Configura las credenciales de Telegram:**
   - Click en el nodo "Telegram Trigger"
   - Click en "Credential to connect"
   - Crea nueva credencial "Telegram API"
   - Pon tu **Access Token** de @BotFather
   - Guarda

4. **Actualiza las credenciales en todos los nodos:**
   - Los nodos que dicen "TU_CREDENTIAL_ID" necesitan tu credencial real
   - Click en cada nodo Telegram → "Credential to connect" → selecciona tu credencial

5. **Activa el workflow:**
   - Click en "Active" (esquina superior izquierda)
   - ¡Listo!

## Comandos disponibles en tu bot:

```
/tareas                  - Ver todas tus tareas
/proyectos               - Ver tus proyectos
/clientes                - Ver tus clientes
/crear_tarea Título | Prioridad HIGH
/crear_proyecto Nombre | Type WORDPRESS
/crear_cliente Nombre | Email: a@b.com
/help                    - Ver ayuda
```

## Ejemplos:

```
/crear_tarea Llamar a Juan | Prioridad URGENT
/crear_proyecto Tienda Online | Type WORDPRESS
/crear_cliente María | Email: maria@empresa.com | Company: SL
```

## API Key:
Obtén tu API Key desde: https://crmdev.tech/settings/api-keys

> Reemplaza `crm_TU_API_KEY` en los nodos HTTP Request con tu API Key real.
