# Configuración de Resend para envío de emails

Para que el sistema de registro, validación de email y reset de contraseña funcionen correctamente, necesitas configurar Resend.

## Pasos de configuración:

### 1. Crear cuenta en Resend

1. Ve a https://resend.com
2. Regístrate o inicia sesión
3. Ve al dashboard: https://resend.com/api-keys

### 2. Verificar el dominio `crmdev.tech`

**IMPORTANTE:** Necesitas verificar el dominio para poder enviar emails desde `noreply@crmdev.tech`.

1. En el dashboard de Resend, ve a "Domains" → https://resend.com/domains
2. Clic en "Add Domain"
3. Ingresa `crmdev.tech`
4. Selecciona "Transactional" (para emails transaccionales como verificaciones)
5. Clic en "Add Domain"

### 3. Configurar DNS

Resend te dará 3 registros DNS que debes añadir en tu proveedor de DNS:

```
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=none

Tipo: TXT
Nombre: resend._domainkey
Valor: [VALOR QUE TE DA RESEND]

Tipo: TXT
Nombre: [nombre verificación]
Valor: [valor verificación]
```

**Para configurar en tu proveedor de DNS:**

- Si usas Cloudflare, GoDaddy, Namecheap, etc.:
  1. Ve a la sección DNS de tu dominio
  2. Añade los 3 registros TXT que te da Resend
  3. Espera unos minutos (puede tardar hasta 24 horas, pero suele ser rápido)

### 4. Verificar que el dominio esté activo

1. Vuelve a Resend → Domains
2. Espera a que el estado cambie a "Active" (puede tardar unos minutos tras añadir los DNS)
3. Si no se activa, clic en "Verify" para forzar la verificación

### 5. Obtener la API Key

1. Ve a https://resend.com/api-keys
2. Clic en "Create API Key"
3. Dale un nombre (ej: "CRMDev Production")
4. Selecciona permisos: "Send" + "Read"
5. Clic en "Create API Key"
6. **COPIA LA API KEY** - solo se muestra una vez

### 6. Configurar en EasyPanel

1. Entra a tu proyecto en EasyPanel
2. Ve a "Environment Variables"
3. Actualiza o añade:
   ```
   RESEND_API_KEY=re_[TU_API_KEY]
   ```

4. Redeploy la aplicación

## Verificar que funciona

Una vez configurado:

1. Regístrate en la app con un nuevo email
2. Deberías recibir un email de verificación
3. También puedes probar el "Forgot Password" en la página de login

## Solución de problemas

### Los emails no llegan

1. **Verifica la carpeta SPAM** - Los emails transaccionales a veces van allí
2. **Revisa los logs de la app:**
   - En EasyPanel, ve a "Logs" de tu contenedor
   - Busca errores con `[EMAIL]`
   - Si ves "Resend not configured", revisa que la API key esté correcta

3. **Verifica el estado del dominio en Resend:**
   - Debe estar en "Active", no "Pending"
   - Si está "Pending", verifica los registros DNS

### Error: "Domain not verified"

- Asegúrate de haber añadido todos los registros DNS
- Espera al menos 15 minutos tras configurar DNS
- Verifica que los registros DNS estén propagados:
  - Puedes usar: https://dnschecker.org/
  - Busca los registros TXT de tu dominio

### Error: "Invalid API Key"

- Verifica que la API key sea correcta en EasyPanel
- Asegúrate de que la API key tenga permisos de "Send"
- Si sigue fallando, crea una nueva API key en Resend

## Variables de entorno necesarias

```
RESEND_API_KEY=re_[TU_API_KEY]
BETTER_AUTH_URL=https://crmdev.tech
NEXT_PUBLIC_APP_URL=https://crmdev.tech
```

## Dirección from que se usará

Los emails se enviarán desde:
```
CRMDev <noreply@crmdev.tech>
```

Esta dirección se configura automáticamente en el código, pero necesitas
verificar el dominio `crmdev.tech` en Resend para poder usarla.
