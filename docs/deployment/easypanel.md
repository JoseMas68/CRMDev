# Despliegue en EasyPanel

## Configuracion en EasyPanel

### 1. Crear nuevo servicio
En EasyPanel, crea un nuevo servicio tipo **Dockerfile** (asegurate de NO usar "Docker Compose").

### 2. Variables de Entorno
Configura las siguientes variables de entorno en EasyPanel:

```bash
# Base de Datos (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_t2iTrWfX0jeb@ep-sparkling-field-abku1jh0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Better Auth
NEXT_PUBLIC_APP_URL="https://crmdev.tech"
BETTER_AUTH_URL="https://crmdev.tech"
BETTER_AUTH_SECRET="tu-secret-aqui"

# GitHub OAuth
GITHUB_CLIENT_ID="tu-client-id-aqui"
GITHUB_CLIENT_SECRET="tu-client-secret-aqui"
GITHUB_WEBHOOK_SECRET=""

# OpenAI (opcional)
OPENAI_API_KEY="tu-openai-key-aqui"

# Resend (opcional)
RESEND_API_KEY="tu-resend-key-aqui"

# Cron Secret
CRON_SECRET="+LDqsT036bgBxxceEGmVXBstbRYNNJ3QwsBZwnpPB08="
```

### 3. Puerto
Expone el puerto **3000**

### 4. Dominio
Configura tu dominio en EasyPanel para que apunte al servicio.

### 5. Base de Datos
El proyecto usa **Neon PostgreSQL** (Serverless Postgres). No necesitas configurar una base de datos en EasyPanel.

### 6. Cron Jobs
EasyPanel soporta cron jobs. Añade este cron para el monitoreo de WordPress:

```
# Cada 6 horas
0 */6 * * * curl -X GET https://crmdev.tech/api/cron/wp-monitor -H "Authorization: Bearer +LDqsT036bgBxxceEGmVXBstbRYNNJ3QwsBZwnpPB08="
```

## Notas Importantes
- **NEXT_PUBLIC_APP_URL** y **BETTER_AUTH_URL** deben ser `https://crmdev.tech`
- Asegúrate de que tu base de datos Neon permite conexiones desde el servidor de EasyPanel
- Los cron jobs de Vercel (`vercel.json`) no funcionan en EasyPanel, configura los crons en el panel de EasyPanel
