/**
 * CORS Configuration for API endpoints
 *
 * Origins are configured via environment variables.
 * Development mode allows localhost ports automatically.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_APP_URL: Main application URL
 * - NEXT_PUBLIC_MCP_PUBLIC_URL: MCP API public URL
 * - ALLOWED_CORS_ORIGINS: Comma-separated list of additional allowed origins (production only)
 */

/**
 * Get list of allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Always allow app URLs from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.NEXT_PUBLIC_MCP_PUBLIC_URL) {
    origins.push(process.env.NEXT_PUBLIC_MCP_PUBLIC_URL);
  }

  // Development: allow localhost ports automatically
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    );
  }

  // Production: additional explicitly allowed origins from env var
  // Example: ALLOWED_CORS_ORIGINS="https://claude.ai,https://example.com"
  const allowedOriginsEnv = process.env.ALLOWED_CORS_ORIGINS;
  if (allowedOriginsEnv) {
    origins.push(...allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean));
  }

  return origins;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false; // No origin header = reject

  const allowedOrigins = getAllowedOrigins();

  // Allow exact matches
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow subdomains of production URL (if configured)
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (productionUrl) {
    try {
      const productionOrigin = new URL(productionUrl);
      const requestOrigin = new URL(origin);

      // Allow same hostname with different ports in dev
      if (
        process.env.NODE_ENV === 'development' &&
        requestOrigin.hostname === productionOrigin.hostname
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Get CORS headers for a given origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isOriginAllowed(origin);

  if (!allowed) {
    // Return restrictive headers for non-allowed origins
    return {};
  }

  const allowedOrigins = getAllowedOrigins();

  return {
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptionsRequest(origin: string | null): Response {
  const headers = getCorsHeaders(origin);

  if (Object.keys(headers).length === 0) {
    return new Response('CORS not allowed', { status: 403 });
  }

  return new Response(null, { headers });
}
