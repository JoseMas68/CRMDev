# Documentación de CRMPro

Bienvenido a la documentación oficial de **CRMPro**, un CRM multi-tenant SaaS diseñado para desarrolladores y agencias.

## 📋 Índice

### [Arquitectura del Sistema](./architecture/)
Documentación técnica sobre la arquitectura y diseño del sistema.

- **[Vista General del Sistema](./architecture/system-overview.md)** - Stack tecnológico, estructura del proyecto y características principales
- **[Integración MCP](./architecture/mcp-integration.md)** - Arquitectura de Model Context Protocol para integraciones con IA
- **[Multi-Tenancy](./architecture/multi-tenancy.md)** - Aislamiento de datos y gestión de organizaciones

### [Guías de Configuración](./guides/)
Tutoriales paso a paso para configurar diferentes aspectos del sistema.

- **[Configuración de Claude Desktop](./guides/claude-desktop-setup.md)** - Conectar Claude Desktop con CRMPro mediante MCP
- **[Gestión de API Keys](./guides/api-keys.md)** - Crear y gestionar API Keys para integraciones
- **[Configuración de Email](./guides/email-setup.md)** - Setup de Resend para envío de emails

### [Despliegue](./deployment/)
Guías para desplegar CRMPro en diferentes plataformas.

- **[Despliegue en EasyPanel](./deployment/easypanel.md)** - Instrucciones para desplegar con Docker en EasyPanel

### [API](./api/)
Documentación de endpoints y APIs externas.

- **[Webhooks](./api/webhooks.md)** - Documentación del endpoint de webhooks para tickets

## 🚀 Comenzando Rápidamente

### Para Desarrolladores

Si eres desarrollador y quieres contribuir o ejecutar el proyecto localmente:

1. **Requisitos previos:**
   - Node.js 18+ y pnpm
   - PostgreSQL (Neon/Supabase recomendado)
   - Cuenta en Better Auth, Resend (opcional), Stripe (opcional)

2. **Instalación:**
   ```bash
   git clone <repository-url>
   cd CRM
   pnpm install
   pnpm db:setup
   ```

3. **Configuración:**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales
   ```

4. **Ejecutar:**
   ```bash
   pnpm dev
   ```

Ver [CLAUDE.md](../CLAUDE.md) para más detalles sobre desarrollo.

### Para Usuarios

Si quieres usar CRMPro para gestionar tus clientes, proyectos y tareas:

1. **Regístrate** en https://crmdev.tech (o tu dominio)
2. **Crea tu organización** durante el registro
3. **Comienza a agregar:**
   - Clientes en la sección "Clients"
   - Proyectos en "Projects"
   - Tareas en "Tasks"

### Para Integraciones con IA

Si quieres conectar CRMPro con Claude Desktop u otros asistentes de IA:

1. **Crea una API Key** en Settings → API Keys
2. **Instala el servidor MCP:**
   ```bash
   curl -sSL https://crmdev.tech/api/mcp/install | node - TU_API_KEY
   ```
3. **Reinicia Claude Desktop**

Ver [Guía de Claude Desktop](./guides/claude-desktop-setup.md) para más detalles.

## 📚 Recursos Adicionales

### Documentación Principal

- **[README del Proyecto](../README.md)** - Información general del proyecto
- **[CLAUDE.md](../CLAUDE.md)** - Instrucciones para Claude Code (AI assistant)

### Archivos de Configuración

- **[.env.example](../.env.example)** - Variables de entorno necesarias
- **[package.json](../package.json)** - Dependencias y scripts
- **[prisma/schema.prisma](../prisma/schema.prisma)** - Esquema de base de datos

### Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo
pnpm build            # Build para producción
pnpm start            # Servidor de producción
pnpm typecheck        # Verificación de tipos
pnpm lint             # Linting de código

# Base de Datos
pnpm db:push          # Push schema a la DB (dev)
pnpm db:studio        # Abrir Prisma Studio
pnpm db:generate      # Generar Prisma client
pnpm db:migrate       # Crear migración
pnpm db:setup         # Generate + push en uno
```

## 🏗️ Arquitectura del Sistema

CRMPro utiliza una arquitectura **multi-tenant con base de datos compartida**:

```
┌─────────────────────────────────────────┐
│        Next.js 15 (App Router)          │
│  ├─ Server Components (RSC)             │
│  ├─ Server Actions                      │
│  └─ API Routes                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Capa de Seguridad               │
│  ├─ Middleware HTTP                     │
│  ├─ Better Auth (Sesiones)              │
│  └─ Prisma Middleware (Tenant Filter)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PostgreSQL (Neon/Supabase)         │
│  ├─ Tablas Globales (users, sessions)   │
│  └─ Tablas de Tenant (con organizationId)│
└─────────────────────────────────────────┘
```

### Stack Tecnológico

- **Frontend:** Next.js 15, React, Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes, Server Actions
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Autenticación:** Better Auth con organizaciones
- **Email:** Resend
- **Pagos:** Stripe (opcional)
- **IA:** MCP (Model Context Protocol)

## 🔐 Seguridad y Multi-Tenancy

CRMPro implementa múltiples capas de seguridad para garantizar el aislamiento de datos entre organizaciones:

1. **Middleware de Prisma:** Filtra automáticamente todas las queries por `organizationId`
2. **Server Actions:** Validan sesión y organización activa
3. **Middleware HTTP:** Protege rutas privadas
4. **API Keys:** Aisladas por organización para integraciones MCP

Ver [Arquitectura Multi-Tenant](./architecture/multi-tenancy.md) para más detalles.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Lee [CLAUDE.md](../CLAUDE.md) para entender la arquitectura
2. Sigue los patrones existentes en el código
3. Usa los comandos `pnpm typecheck` y `pnpm lint` antes de commitear
4. Asegúrate de que todas las operaciones usen `getPrismaWithSession()`

## 📞 Soporte

Si necesitas ayuda:

- **Documentación técnica:** Revisa las secciones de [Arquitectura](./architecture/)
- **Guías de configuración:** Revisa las [Guías](./guides/)
- **Issues:** Crea un issue en el repositorio del proyecto
- **Email:** soporte@crmdev.tech (si está disponible)

## 📄 Licencia

Este proyecto está bajo una licencia propietaria. Todos los derechos reservados.

---

**Última actualización:** 10 de marzo de 2026

**Versión:** 1.0.0
