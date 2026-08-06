import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from './vercel.js';
import { env } from './env.js';
import { header, HttpError } from './http.js';
import { service } from './supabase.js';

export function requestFingerprint(req: VercelRequest): string {
  const forwarded = header(req, 'x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || header(req, 'x-real-ip') || 'unknown';
  const agent = header(req, 'user-agent') || 'unknown';
  return createHmac('sha256', env().RATE_LIMIT_SECRET)
    /* L'IP reste l'identité principale : inclure systématiquement le
       User-Agent permettrait à un robot de contourner le quota en le changeant. */
    .update(ip === 'unknown' ? `unknown\n${agent}` : ip)
    .digest('hex');
}

export async function consumeQuota(req: VercelRequest): Promise<void> {
  const { data, error } = await service().rpc('consume_submission_quota', {
    p_fingerprint: requestFingerprint(req)
  });
  if (error) {
    // Une fonction absente ou un droit manquant est un defaut
    // d'installation, pas un abus du visiteur : il doit se nommer.
    console.error('[api] quota anti-spam indisponible :', error.code, error.message);
    throw new HttpError(
      503,
      'Le contrôle anti-spam est indisponible (fonction consume_submission_quota).',
      'quota_unavailable',
      error.code || 'sans-code'
    );
  }
  if (data !== true) {
    throw new HttpError(429, 'Trop de propositions. Réessaie dans une heure.', 'rate_limited');
  }
}

export function createUploadToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashUploadToken(token) };
}

export function verifyUploadToken(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashUploadToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashUploadToken(token: string): string {
  return createHash('sha256')
    .update(env().UPLOAD_TOKEN_SECRET)
    .update('\0')
    .update(token)
    .digest('hex');
}
