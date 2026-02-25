// Instructions for users to install MCP integration
export const MCP_INSTALL_INSTRUCTIONS = `
## Instalar Claude Desktop Integration

### Opción 1: Instalación Automática (Windows/Mac/Linux)

1. Abre tu terminal

2. Ejecuta este comando (reemplaza TU_API_KEY):
   \`\`\`bash
   curl -sSL https://crmdev.tech/api/mcp/install | node - TU_API_KEY
   \`\`\`

3. Reinicia Claude Desktop

### Opción 2: Instalación Manual

#### Windows:
\`\`\`bash
curl -sSL https://crmdev.tech/api/mcp/install.js -o install-mcp.js
node install-mcp.js TU_API_KEY
\`\`\`

#### Mac/Linux:
\`\`\`bash
curl -sSL https://crmdev.tech/api/mcp/install.js -o install-mcp.js
node install-mcp.js TU_API_KEY
\`\`\`

### Verificar Instalación

En Claude Desktop, escribe en un nuevo chat:
- "¿Qué proyectos tengo en mi CRM?"
- "Crear tarea 'Llamar a cliente' con prioridad alta"
`;
