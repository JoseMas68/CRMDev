# Despliegue en EasyPanel

## Configuración en EasyPanel

### 1. Crear nuevo servicio

En EasyPanel, crea un nuevo servicio tipo **Docker Compose** o **Dockerfile**.

### 2. Variables de Entorno

Configura las siguientes variables de entorno en EasyPanel:

```bash
# Base de Datos (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_t2iTrWfX0jeb@ep-sparkling-field-abku1jh0-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Better Auth (CAMBIAR la URL por tu dominio real)
NEXT_PUBLIC_APP_URL="https://crmdev.tech"
BETTER_AUTH_URL="https://crmdev.tech"
BETTER_AUTH_SECRET="qd0wJGUiSfA/Nok/W3HSIjUzq6tiFt6pfijmMsTx+SE="

# GitHub OAuth
GITHUB_CLIENT_ID="Ov23liCGQ6fuwBz1VJMf"
GITHUB_CLIENT_SECRET="73485eeb5bddc8806df4e863705b7f3603878e2e"

# OpenAI (opcional, para soporte con IA)
OPENAI_API_KEY="sk-your-openai-key-here"

# Resend (para emails de verificación y invitaciones)
RESEND_API_KEY="re-your-resend-api-key-here"

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

## Despliegue Local con Docker

```bash
# Construir la imagen
docker build -t crmdev .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env.local crmdev
```

## Con Docker Compose

```bash
# Copiar .env.local a .env
cp .env.local .env

# Levantar servicios
docker-compose up -d --build
```

## Notas Importantes

- **NEXT_PUBLIC_APP_URL** y **BETTER_AUTH_URL** deben ser `https://crmdev.tech`
- Asegúrate de que tu base de datos Neon permite conexiones desde el servidor de EasyPanel
- Los cron jobs de Vercel (`vercel.json`) no funcionan en EasyPanel, configura los crons en el panel de EasyPanel
