import type { VercelRequest, VercelResponse } from './vercel.js';
import { env } from './env.js';
import { HttpError } from './errors.js';

export { HttpError };

export function json(res: VercelResponse, status: number, value: unknown): void {
  res.status(status).json(value);
}

export function noStore(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
}

export function method(req: VercelRequest, allowed: readonly string[]): void {
  if (!req.method || !allowed.includes(req.method)) {
    throw new HttpError(405, 'Méthode non autorisée.', 'method_not_allowed');
  }
}

export function sameOrigin(req: VercelRequest): void {
  const origin = header(req, 'origin');
  if (!origin) return;

  const configured = env().PUBLIC_SITE_URL?.replace(/\/$/, '');
  const proto = header(req, 'x-forwarded-proto') || 'https';
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  const current = host ? `${proto}://${host}` : undefined;
  const allowed = new Set([configured, current].filter(Boolean));
  if (!allowed.has(origin.replace(/\/$/, ''))) {
    throw new HttpError(403, 'Origine refusée.', 'origin_forbidden');
  }
}

export function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function bodyOf(req: VercelRequest): unknown {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Corps JSON invalide.', 'invalid_json');
    }
  }
  return req.body;
}

export function handleError(res: VercelResponse, error: unknown): void {
  if (error instanceof HttpError) {
    json(res, error.status, {
      error: error.code,
      message: error.message,
      ...(error.indice ? { indice: error.indice } : {})
    });
    return;
  }
  if (error && typeof error === 'object' && 'issues' in error) {
    json(res, 400, { error: 'invalid_input', message: 'Données invalides.' });
    return;
  }
  console.error('[api]', error);
  json(res, 500, { error: 'internal_error', message: 'Le service est momentanément indisponible.' });
}
