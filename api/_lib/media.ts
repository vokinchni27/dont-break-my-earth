import { env } from './env.js';
import type { ALLOWED_MIME_TYPES } from './validation.js';

type AllowedMime = typeof ALLOWED_MIME_TYPES[number];

export function matchesImageSignature(bytes: Uint8Array, mime: AllowedMime): boolean {
  if (mime === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === 'image/png') {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((value, index) => bytes[index] === value);
  }
  const ascii = new TextDecoder('ascii').decode(bytes);
  if (mime === 'image/webp') {
    return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  }
  return ascii.slice(4, 12) === 'ftypavif' ||
    ascii.slice(4, 12) === 'ftypavis' ||
    (ascii.slice(4, 8) === 'ftyp' && ascii.slice(8, 64).includes('avif'));
}

export async function verifyStoredImage(
  bucket: string,
  path: string,
  mime: AllowedMime
): Promise<boolean> {
  const cfg = env();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${cfg.SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedPath}`;
  const response = await fetch(url, {
    headers: {
      apikey: cfg.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
      Range: 'bytes=0-63'
    }
  });
  if (!response.ok) return false;
  const bytes = new Uint8Array(await response.arrayBuffer());
  return matchesImageSignature(bytes.subarray(0, 64), mime);
}
