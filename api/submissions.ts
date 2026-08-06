import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from './_lib/vercel.js';
import { env } from './_lib/env.js';
import {
  bodyOf,
  handleError,
  HttpError,
  json,
  method,
  noStore,
  sameOrigin
} from './_lib/http.js';
import { verifyStoredImage } from './_lib/media.js';
import { consumeQuota, createUploadToken, verifyUploadToken } from './_lib/security.js';
import { assurerBucket, service } from './_lib/supabase.js';
import {
  ALLOWED_MIME_TYPES,
  extensionFor,
  nullableText,
  submissionCompleteSchema,
  submissionCreateSchema
} from './_lib/validation.js';

const PUBLIC_FIELDS = 'id,storage_bucket,storage_path,original_filename,mime_type,width,height,latitude,longitude,location_label,comment,author_name,created_at,approved_at' as const;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    method(req, ['GET', 'POST', 'PATCH']);
    if (req.method !== 'GET') {
      noStore(res);
      sameOrigin(req);
    }

    if (req.method === 'GET') return await listApproved(res);
    if (req.method === 'POST') return await prepareUpload(req, res);
    return await completeUpload(req, res);
  } catch (error) {
    handleError(res, error);
  }
}

async function listApproved(res: VercelResponse): Promise<void> {
  const supabase = service();
  const { data, error } = await supabase
    .from('submissions')
    .select(PUBLIC_FIELDS)
    .eq('status', 'approved')
    .not('upload_completed_at', 'is', null)
    .order('approved_at', { ascending: false })
    .limit(400);
  if (error) throw error;

  const rows = data ?? [];
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const bucketRows = grouped.get(row.storage_bucket) ?? [];
    bucketRows.push(row);
    grouped.set(row.storage_bucket, bucketRows);
  }

  const signedByPath = new Map<string, string>();
  for (const [bucket, bucketRows] of grouped) {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrls(bucketRows.map((row) => row.storage_path), env().SIGNED_URL_TTL_SECONDS);
    if (signError) throw signError;
    for (const item of signed ?? []) {
      if (item.signedUrl) signedByPath.set(`${bucket}/${item.path}`, item.signedUrl);
    }
  }

  const submissions = rows.flatMap((row) => {
    const imageUrl = signedByPath.get(`${row.storage_bucket}/${row.storage_path}`);
    return imageUrl ? [{ ...row, image_url: imageUrl }] : [];
  });
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  json(res, 200, { submissions });
}

async function prepareUpload(req: VercelRequest, res: VercelResponse): Promise<void> {
  const input = submissionCreateSchema.parse(bodyOf(req));
  const cfg = env();
  if (input.sizeBytes > cfg.MAX_UPLOAD_BYTES) {
    throw new HttpError(413, 'Fichier trop volumineux.', 'file_too_large');
  }

  const age = Date.now() - input.formStartedAt;
  if (input.website || age < 1_200 || age > 3_600_000) {
    throw new HttpError(400, 'Proposition invalide.', 'invalid_submission');
  }
  await consumeQuota(req);
  await assurerBucket();
  const supabase = service();

  const now = new Date();
  const id = randomUUID();
  const path = [
    'pending',
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    `${id}.${extensionFor(input.mimeType)}`
  ].join('/');
  const upload = createUploadToken();

  const { error: insertError } = await supabase.from('submissions').insert({
    id,
    storage_bucket: 'earth',
    storage_path: path,
    original_filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    width: input.width ?? null,
    height: input.height ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_label: nullableText(input.locationLabel),
    comment: nullableText(input.comment),
    author_name: nullableText(input.authorName),
    status: 'pending',
    upload_token_hash: upload.hash
  });
  if (insertError) throw insertError;

  const { data: signed, error: signedError } = await supabase.storage
    .from('earth')
    .createSignedUploadUrl(path, { upsert: false });
  if (signedError || !signed?.signedUrl) {
    await supabase.from('submissions').delete().eq('id', id);
    // Un 500 muet ici coûte une soirée : le seul moyen de savoir que
    // le bucket manque était de lire les journaux Vercel. On nomme la
    // panne — c'est un défaut d'installation, pas une faute du visiteur.
    console.error('[api] bucket « earth » injoignable :', signedError?.message);
    throw new HttpError(
      503,
      'Le stockage des captures n’est pas prêt : le bucket « earth » manque dans Supabase.',
      'storage_unavailable'
    );
  }

  json(res, 201, {
    submissionId: id,
    signedUrl: signed.signedUrl,
    uploadToken: upload.token
  });
}

async function completeUpload(req: VercelRequest, res: VercelResponse): Promise<void> {
  const input = submissionCompleteSchema.parse(bodyOf(req));
  const supabase = service();
  const { data: row, error: rowError } = await supabase
    .from('submissions')
    .select('id,storage_bucket,storage_path,mime_type,size_bytes,status,upload_token_hash,upload_completed_at')
    .eq('id', input.submissionId)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row || row.status !== 'pending') {
    throw new HttpError(404, 'Proposition introuvable.', 'submission_not_found');
  }
  if (row.upload_completed_at) {
    json(res, 200, { submissionId: row.id, status: 'pending' });
    return;
  }
  if (!row.upload_token_hash || !verifyUploadToken(input.uploadToken, row.upload_token_hash)) {
    throw new HttpError(403, 'Jeton de dépôt invalide.', 'invalid_upload_token');
  }

  const parts = String(row.storage_path).split('/');
  const filename = parts.pop();
  if (!filename) throw new HttpError(400, 'Chemin de fichier invalide.', 'invalid_storage_path');
  const folder = parts.join('/');
  const { data: objects, error: listError } = await supabase.storage
    .from(row.storage_bucket)
    .list(folder, { limit: 10, search: filename });
  if (listError) throw listError;
  const object = objects?.find((item) => item.name === filename);
  const metadata = object?.metadata as { size?: number; mimetype?: string } | undefined;
  const actualSize = Number(metadata?.size ?? 0);
  const actualMime = metadata?.mimetype;
  const allowedMime = actualMime && ALLOWED_MIME_TYPES.includes(actualMime as typeof ALLOWED_MIME_TYPES[number])
    ? actualMime as typeof ALLOWED_MIME_TYPES[number]
    : null;
  const validSignature = allowedMime
    ? await verifyStoredImage(row.storage_bucket, row.storage_path, allowedMime)
    : false;
  if (!object || actualSize < 1 || actualSize > env().MAX_UPLOAD_BYTES ||
      !actualMime || !ALLOWED_MIME_TYPES.includes(actualMime as typeof ALLOWED_MIME_TYPES[number]) ||
      actualMime !== row.mime_type || !validSignature) {
    if (object) await supabase.storage.from(row.storage_bucket).remove([row.storage_path]);
    await supabase.from('submissions').delete().eq('id', row.id);
    throw new HttpError(400, 'Le fichier reçu est invalide.', 'invalid_uploaded_file');
  }

  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      upload_completed_at: new Date().toISOString(),
      upload_token_hash: null,
      size_bytes: actualSize
    })
    .eq('id', row.id)
    .eq('status', 'pending');
  if (updateError) throw updateError;
  json(res, 200, { submissionId: row.id, status: 'pending' });
}
