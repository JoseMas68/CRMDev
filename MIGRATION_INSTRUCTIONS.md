# Instrucciones de Migración - Campos Extendidos de Proyectos

## ¿Qué se agregó?

Se agregaron **17 nuevos campos** al modelo `Project` en Prisma:

### 1. Información de Producción (4 campos)
- `productionUrl` - URL de producción
- `stagingUrl` - URL de staging
- `developmentUrl` - URL de desarrollo
- `hostingProvider` - Proveedor (AWS, Vercel, etc)

### 2. Almacenamiento y Documentación (4 campos)
- `driveFolder` - Enlace a carpeta de Google Drive
- `figmaLink` - Enlace a Figma
- `githubLink` - Enlace a GitHub
- `documentationLink` - Enlace a documentación técnica

### 3. Caja Fuerte para Env (2 campos)
- `envVars` - Variables de entorno (JSON encriptado)
- `envVarsLastUpdated` - Fecha de última actualización

### 4. Información Técnica (2 campos)
- `techDatabase` - Base de datos (PostgreSQL, MongoDB, etc)
- `runtimeVersion` - Versión de runtime (Node, Python, etc)

### 5. Contactos Clave (3 campos)
- `devopsContact` - Email del DevOps principal
- `primaryClientContact` - Email del cliente principal
- `emergencyContact` - Contacto de emergencia

## ¿Cómo aplicar la migración?

### Opción 1: Usando Prisma Migrate (Recomendado)

```bash
cd /path/to/CRMDev

# Aplicar la migración
npx prisma db push

# Regenerar el cliente Prisma
npx prisma generate

# Reinicia el servidor
npm run dev
```

### Opción 2: Usando Prisma Migrate Deploy (Si ya tienes migraciones)

```bash
cd /path/to/CRMDev

npx prisma migrate deploy

# Regenerar el cliente
npx prisma generate

# Reinicia
npm run dev
```

### Opción 3: Ejecutar SQL directamente (Si tienes acceso a psql)

```bash
# Desde tu terminal
psql "$DATABASE_URL" -f prisma/migrations/add_extended_project_fields/migration.sql

# Luego regenera Prisma
npx prisma generate
```

## Después de la migración

1. ✅ Los campos aparecerán en el formulario de crear proyecto
2. ✅ Los campos aparecerán en el formulario de editar proyecto
3. ✅ Los campos estarán disponibles en la API
4. ✅ Los valores existentes serán NULL (vacíos)

## Archivos Modificados

- `prisma/schema.prisma` - Schema actualizado con 17 nuevos campos
- `src/lib/validations/project.ts` - Validación Zod actualizada
- `src/components/projects/edit-project-form.tsx` - UI con 5 nuevas cards
- `prisma/migrations/add_extended_project_fields/` - Archivo de migración SQL

## En caso de problemas con Prisma 7

Si tienes errores con `datasource.url`, intenta:

```bash
# Usar prisma.config.ts
npx prisma db push --schema=./prisma/schema.prisma
```

Si aún no funciona, ejecuta la migración SQL directamente:

```bash
psql "$DATABASE_URL" < prisma/migrations/add_extended_project_fields/migration.sql
```
