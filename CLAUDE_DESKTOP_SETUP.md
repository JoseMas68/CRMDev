# Conectar Claude Desktop con CRMDev

> 📌 **Importante**: Cada usuario de CRMDev crea su propia API Key y configura su conexión. Claude solo accederá a los datos de la organización del usuario.

---

## 🚀 Instalación en 3 Pasos

### Paso 1: Obtener tu API Key

1. Entra a **https://crmdev.tech**
2. Ve a **Settings → API Keys**
3. Click en **"Crear nueva API Key"**
4. Ponle un nombre (ej: "Mi Claude Desktop")
5. **Copia la key inmediatamente** - formato: `crm_xxxxxxxxxxxxxxxx`

### Paso 2: Instalar el Servidor MCP (Automático)

Abre tu terminal y ejecuta (reemplaza `TU_API_KEY`):

```bash
curl -sSL https://crmdev.tech/api/mcp/install | node - TU_API_KEY
```

**Ejemplo real:**
```bash
curl -sSL https://crmdev.tech/api/mcp/install | node - crm_6df28433c4ec7ac15ef43d5fca54bbadc725452f81623cc5
```

Este comando:
- ✅ Descarga el servidor MCP
- ✅ Lo instala en tu sistema
- ✅ Configura Claude Desktop automáticamente

### Paso 3: ¡Usar Claude con tu CRM!

1. **Reinicia Claude Desktop** completamente (ciérralo y ábrelo de nuevo)
2. En un nuevo chat, prueba:

```
¿Qué proyectos tengo en mi CRM?
```

```
Crea una tarea llamada "Llamar a cliente" con prioridad HIGH
```

```
Lista todos mis clientes con status LEAD
```

---

## 🎯 Ejemplos de Comandos

### Proyectos
- "¿Qué proyectos tengo?"
- "Crear proyecto 'Tienda Online' con descripción 'E-commerce'"
- "Marcar el proyecto X como completado"

### Tareas
- "¿Qué tareas pendientes tengo?"
- "Crear tarea urgente: 'Fix bug en login'"
- "Listar todas las tareas HIGH priority del proyecto Y"

### Clientes
- "¿Quiénes son todos mis clientes?"
- "Crear cliente 'Juan Pérez' con email juan@empresa.com"
- "Actualizar el cliente X a status CUSTOMER"

---

## 🔒 Seguridad y Privacidad

✅ **Cada API Key es única por organización**
✅ **Claude solo ve los datos de TU organización**
✅ **Puedes revocar tu API Key en cualquier momento**

⚠️ **Nunca compartas tu API Key** - Da acceso completo a tu CRM

---

## 📋 Herramientas Disponibles

| Herramienta | Descripción | Ejemplo |
|-------------|-------------|---------|
| `list_projects` | Ver todos tus proyectos | "Mis proyectos" |
| `create_project` | Crear un nuevo proyecto | "Crear proyecto 'Web App'" |
| `list_tasks` | Ver tus tareas | "Mis tareas pendientes" |
| `create_task` | Crear una tarea | "Crear tarea 'Revisar PR'" |
| `list_clients` | Ver tus clientes | "Mis clientes activos" |
| `create_client` | Crear un cliente | "Agregar cliente 'María López'" |

---

## ⚠️ Troubleshooting

### Claude no muestra las herramientas
1. Asegúrate de haber reiniciado Claude Desktop completamente
2. Verifica que el comando de instalación se ejecutó sin errores
3. Verifica que tu API Key sea válida

### Error de instalación
**Si `curl` no funciona:**

#### Opción alternativa: Descargar manual

1. Descarga el instalador:
   ```bash
   # Descargar el archivo
   curl -O https://crmdev.tech/api/mcp/install
   # O con PowerShell:
   # Invoke-WebRequest -Uri "https://crmdev.tech/api/mcp/install" -OutFile "install.js"
   ```

2. Ejecuta:
   ```bash
   node install TU_API_KEY
   ```

### Error "Module not found"
El instalador necesita las dependencias del SDK de MCP. Asegúrate de tener Node.js instalado:

```bash
# Verificar Node.js
node --version  # Debe ser v18 o superior
```

---

## 🎁 Bonus: ChatGPT y Otras IAs

Este mismo sistema funciona con cualquier IA que soporte REST API:

**Endpoint:** `https://crmdev.tech/api/mcp/rest`

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

- **Crea diferentes API Keys** para diferentes dispositivos
- **Nombra tus API Keys** con algo descriptivo
- **Revoca y regenera** API Keys periódicamente por seguridad
- **Verifica la actividad** de tus API Keys en Settings → API Keys
