/**
 * CORS Configuration for API endpoints
 *
 * Security: Restricts cross-origin requests to trusted origins only
 */

// Whitelist of allowed origins
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_MCP_PUBLIC_URL,
  'https://claude.ai', // For Claude Desktop integration
  'http://localhost:3000', // Development
  'http://localhost:3001', // Alternative dev port
].filter(Boolean) as string[];

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false; // No origin header = reject

  // Allow exact matches
  if (ALLOWED_ORIGINS.includes(origin)) {
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

  return {
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
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
