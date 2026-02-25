# Conectar Claude Desktop con CRMDev

## 🔧 Configuración de Claude Desktop

### Paso 1: Instalar Dependencias

```bash
cd c:/Users/Jose/Desktop/Proyectos/CRM
pnpm install
```

### Paso 2: Configurar Claude Desktop

1. **Abre Claude Desktop**

2. **Ve a Settings → MCP** (o edita el config directamente)

3. **Windows**: El config está en:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```
   O ejecuta: `notepad %APPDATA%\Claude\claude_desktop_config.json`

4. **Agrega esta configuración**:
   ```json
   {
     "mcpServers": {
       "crmdev": {
         "command": "node",
         "args": ["C:/Users/Jose/Desktop/Proyectos/CRM/mcp-server.js"],
         "env": {
           "CRM_API_KEY": "crm_6df28433c4ec7ac15ef43d5fca54bbadc725452f81623cc5"
         }
       }
     }
   }
   ```

5. **Reinicia Claude Desktop**

### Paso 3: Verificar que Funciona

En Claude Desktop, abre un nuevo chat y prueba:

```
¿Qué proyectos tengo en CRMDev?
```

```
Crea una nueva tarea llamada "Revisar código" con prioridad HIGH
```

```
Lista todos los clientes con status LEAD
```

---

## 📋 Herramientas Disponibles

| Tool | Descripción | Ejemplo |
|------|-------------|---------|
| `list_projects` | Listar proyectos | "¿Qué proyectos hay?" |
| `create_project` | Crear proyecto | "Crea proyecto 'Web App'" |
| `list_tasks` | Listar tareas | "¿Qué tareas pendientes hay?" |
| `create_task` | Crear tarea | "Crea tarea 'Fix bug'" |
| `list_clients` | Listar clientes | "¿Quiénes son mis clientes?" |
| `create_client` | Crear cliente | "Agrega cliente Juan Pérez" |

---

## ⚠️ Troubleshooting

### Claude no reconoce las herramientas
1. Verifica que el config JSON esté correcto
2. Reinicia Claude Desktop completamente
3. Verifica que `node mcp-server.js` funcione en terminal

### Error de conexión
1. Verifica que el deploy esté terminado en EasyPanel
2. Prueba el endpoint: `node scripts/test-mcp-rest.js`
3. Verifica la API Key esté vigente

---

## 🎯 Ejemplos de Uso

```
// Claude puede hacer esto naturalmente:

"Crear un proyecto nuevo llamado 'E-commerce' con descripción 'Tienda online'"

"Listar todas las tareas con prioridad HIGH"

"Agregar un cliente llamado María García con email maria@empresa.com"

"¿Cuántas horas se han trabajado en el proyecto X?"
```
