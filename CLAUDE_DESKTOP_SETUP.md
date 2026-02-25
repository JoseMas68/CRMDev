# Conectar Claude Desktop con CRMDev

> 📌 **Importante**: Cada usuario de CRMDev crea su propia API Key y configura su conexión. Claude solo accederá a los datos de la organización del usuario.

---

## 🚀 Configuración Rápida (Para Usuarios)

### Paso 1: Crear tu API Key en CRMDev

1. Entra a **https://crmdev.tech**
2. Ve a **Settings → API Keys**
3. Click en **"Crear nueva API Key"**
4. Ponle un nombre (ej: "Mi Claude Desktop")
5. **Copia la key inmediatamente** - formato: `crm_xxxxxxxxxxxxxxxx`

### Paso 2: Configurar Claude Desktop

#### Windows:
1. Abre el archivo de configuración:
   ```
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Agrega esto (reemplaza `TU_API_KEY` y `RUTA_AL_PROYECTO`):
   ```json
   {
     "mcpServers": {
       "crmdev": {
         "command": "node",
         "args": ["RUTA_AL_PROYECTO/mcp-server.js"],
         "env": {
           "CRM_API_KEY": "TU_API_KEY_AQUI"
         }
       }
     }
   }
   ```

   **Ejemplo** (si el proyecto está en `C:\Projects\CRM`):
   ```json
   {
     "mcpServers": {
       "crmdev": {
         "command": "node",
         "args": ["C:/Projects/CRM/mcp-server.js"],
         "env": {
           "CRM_API_KEY": "crm_abc123..."
         }
       }
     }
   }
   ```

   Si ya tienes otros servidores MCP, solo agrega `"crmdev": { ... }` dentro de `"mcpServers"`.

3. Guarda el archivo

4. **Reinicia Claude Desktop** completamente (ciérralo y ábrelo de nuevo)

### Paso 3: ¡Usar Claude con tu CRM!

En un nuevo chat de Claude, prueba:

```
¿Qué proyectos tengo en mi CRM?
```

```
Crea una tarea llamada "Llamar a cliente" para el proyecto X
```

```
Lista todos mis clientes con status LEAD
```

---

## 🎯 Ejemplos de Comandos

### Proyectos
- "¿Qué proyectos tengo?"
- "Crear proyecto 'Tienda Online' con descripción 'E-commerce para cliente X'"
- "Actualizar el progreso del proyecto X al 50%"

### Tareas
- "¿Qué tareas pendientes tengo?"
- "Crear tarea urgente: 'Fix bug en login'"
- "Listar todas las tareas con prioridad HIGH del proyecto Y"

### Clientes
- "¿Quiénes son todos mis clientes?"
- "Crear cliente 'Juan Pérez' con email juan@empresa.com"
- "Actualizar el cliente X a status CUSTOMER"

---

## 🔒 Seguridad y Privacidad

✅ **Cada API Key es única por organización**
✅ **Claude solo ve los datos de TU organización**
✅ **Puedes revocar tu API Key en cualquier momento desde Settings**

⚠️ **Nunca compartas tu API Key** - Da acceso completo a tu CRM

---

## 📋 Herramientas Disponibles

| Herramienta | Descripción | Ejemplo |
|-------------|-------------|---------|
| `list_projects` | Ver todos tus proyectos | "Mis proyectos" |
| `create_project` | Crear un nuevo proyecto | "Crear proyecto 'Web App'" |
| `update_project` | Actualizar un proyecto | "Marcar proyecto X como completado" |
| `delete_project` | Eliminar un proyecto | "Borrar proyecto de prueba" |
| `list_tasks` | Ver tus tareas | "Mis tareas pendientes" |
| `create_task` | Crear una tarea | "Crear tarea 'Revisar PR'" |
| `update_task` | Actualizar una tarea | "Completar tarea X" |
| `delete_task` | Eliminar una tarea | "Borrar tarea de prueba" |
| `list_clients` | Ver tus clientes | "Mis clientes activos" |
| `create_client` | Crear un cliente | "Agregar cliente 'María López'" |
| `update_client` | Actualizar un cliente | "Actualizar email del cliente X" |
| `delete_client` | Eliminar un cliente | "Borrar cliente de prueba" |

---

## ⚠️ Troubleshooting

### Claude no muestra las herramientas
1. Verifica que el archivo de configuración esté correcto (JSON válido)
2. Asegúrate de haber reiniciado Claude Desktop
3. Verifica que tu API Key sea válida (crea una nueva si es necesario)

### Error de conexión
1. **Prueba tu API Key primero**:
   ```bash
   curl -H "Authorization: Bearer TU_API_KEY" https://crmdev.tech/api/mcp/rest
   ```

2. Si responde correctamente, la API Key funciona

### Error "Server not found"
1. Verifica que la ruta en `args` sea correcta:
   - Debe apuntar a donde tienes el proyecto: `TU_RUTA/mcp-server.js`

2. **Ejemplos de rutas**:
   - Windows: `"C:/Projects/CRM/mcp-server.js"`
   - Mac/Linux: `"/home/usuario/projects/CRM/mcp-server.js"`

3. Usa **barras hacia adelante** (/) incluso en Windows, o escapa las barras invertidas (\\)

---

## 🎁 Bonus: ChatGPT y Otras IAs

Este mismo sistema funciona con cualquier IA que soporte MCP o REST API:

**Para conectar ChatGPT u otra IA:**
1. Crea tu API Key en CRMDev
2. Usa el endpoint REST: `https://crmdev.tech/api/mcp/rest`
3. Envía requests con tu API Key en el header `Authorization: Bearer TU_KEY`

**Ejemplo de request:**
```json
POST https://crmdev.tech/api/mcp/rest
Authorization: Bearer crm_TU_KEY
Content-Type: application/json

{
  "tool": "list_projects",
  "arguments": {}
}
```

---

## 💡 Tips

- **Crea diferentes API Keys** para diferentes dispositivos (Claude Desktop en casa, en el trabajo, etc.)
- **Nombra tus API Keys** con algo descriptivo: "Claude Laptop", "Claude Work", "ChatGPT Integration"
- **Revoca y regenera** API Keys periódicamente por seguridad
- **Verifica la actividad** de tus API Keys en Settings → API Keys (muestra "Último uso")
