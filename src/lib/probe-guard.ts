/**
 * Bloqueo de rutas sensibles (sondeos automatizados: .env, .git, backups, etc.).
 * Compatible con Edge Middleware — sin APIs de Node.
 */

const BLOCKED_PREFIXES = [
  '/.env',
  '/.git',
  '/.aws',
  '/.ssh',
  '/.vscode',
  '/.cursor',
  '/.docker',
  '/.next',
  '/node_modules',
  '/data',
  '/coverage',
  '/.vercel',
  '/.railway',
] as const;

const BLOCKED_EXACT = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/dockerfile',
  '/railway.toml',
  '/composer.json',
  '/wp-config.php',
  '/web.config',
  '/.htaccess',
  '/.htpasswd',
]);

const BLOCKED_PATTERN =
  /(?:^|\/)(?:\.env(?:\.|$)|wp-admin|wp-login|phpmyadmin|phpinfo|\.sql$|\.bak$|\.zip$|\.tar$|\.gz$|backup|shell\.php|eval-stdin|\.pem$|\.key$|\.pfx$|id_rsa|\.DS_Store)/i;

const ALLOWED_API_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function hasPathTraversal(pathname: string): boolean {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.includes('..') || decoded.includes('\\') || decoded.includes('\0');
  } catch {
    return true;
  }
}

export function isBlockedProbePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();

  if (BLOCKED_EXACT.has(lower)) return true;

  for (const prefix of BLOCKED_PREFIXES) {
    if (lower === prefix || lower.startsWith(`${prefix}/`)) return true;
  }

  if (lower.includes('/.env') || lower.endsWith('.env')) return true;
  if (BLOCKED_PATTERN.test(lower)) return true;

  return false;
}

export function isDisallowedMethod(pathname: string, method: string): boolean {
  const verb = method.toUpperCase();
  if (pathname.startsWith('/api/')) {
    return !ALLOWED_API_METHODS.has(verb);
  }
  return !['GET', 'HEAD', 'OPTIONS'].includes(verb);
}

/** Respuesta mínima — no revelar si el recurso existe. */
export function probeBlockedResponse(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
