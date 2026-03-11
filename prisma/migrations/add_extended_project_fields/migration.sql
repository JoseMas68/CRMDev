-- Información de Producción
ALTER TABLE "projects" ADD COLUMN "productionUrl" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "stagingUrl" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "developmentUrl" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "hostingProvider" VARCHAR(100);

-- Almacenamiento y Documentación
ALTER TABLE "projects" ADD COLUMN "driveFolder" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "figmaLink" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "githubLink" VARCHAR(500);
ALTER TABLE "projects" ADD COLUMN "documentationLink" VARCHAR(500);

-- Caja Fuerte para Env
ALTER TABLE "projects" ADD COLUMN "envVars" TEXT;
ALTER TABLE "projects" ADD COLUMN "envVarsLastUpdated" TIMESTAMP(3);

-- Información Técnica
ALTER TABLE "projects" ADD COLUMN "techDatabase" VARCHAR(100);
ALTER TABLE "projects" ADD COLUMN "runtimeVersion" VARCHAR(100);

-- Contactos Clave
ALTER TABLE "projects" ADD COLUMN "devopsContact" VARCHAR(200);
ALTER TABLE "projects" ADD COLUMN "primaryClientContact" VARCHAR(200);
ALTER TABLE "projects" ADD COLUMN "emergencyContact" VARCHAR(200);
