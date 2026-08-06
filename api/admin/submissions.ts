import type { VercelRequest, VercelResponse } from '../_lib/vercel.js';
import { env } from '../_lib/env.js';
import {
  bodyOf,
  handleError,
  HttpError,
  json,
  method,
  noStore,
  sameOrigin
} from '../_lib/http.js';
import { audit, requireAdmin, service } from '../_lib/supabase.js';
import { moderationSchema, nullableText } from '../_lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    method(req, ['GET', 'PATCH', 'DELETE']);
    noStore(res);
    sameOrigin(req);
    const user = await requireAdmin(req);
    if (req.method === 'GET') return await list(res);
    if (req.method === 'PATCH') return await moderate(req, res, user);
    return await remove(req, res, user);
  } catch (error) {
    handleError(res, error);
  }
}

async function list(res: VercelResponse): Promise<void> {
  const supabase = service();
  await cleanupAbandonedUploads();
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .not('upload_completed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);
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
      .createSignedUrls(bucketRows.map((row) => row.storage_path), Math.min(env().SIGNED_URL_TTL_SECONDS, 3_600));
    if (signError) throw signError;
    for (const item of signed ?? []) {
      if (item.signedUrl) signedByPath.set(`${bucket}/${item.path}`, item.signedUrl);
    }
  }
  json(res, 200, {
    submissions: rows.map((row) => ({
      ...row,
      image_url: signedByPath.get(`${row.storage_bucket}/${row.storage_path}`) ?? null,
      upload_token_hash: undefined
    }))
  });
}

async function cleanupAbandonedUploads(): Promise<void> {
  const supabase = service();
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: abandoned, error } = await supabase
    .from('submissions')
    .select('id,storage_bucket,storage_path')
    .is('upload_completed_at', null)
    .lt('created_at', cutoff)
    .limit(100);
  if (error || !abandoned?.length) return;

  for (const row of abandoned) {
    await supabase.storage.from(row.storage_bucket).remove([row.storage_path]);
  }
  await supabase.from('submissions').delete().in('id', abandoned.map((row) => row.id));
}

async function moderate(
  req: VercelRequest,
  res: VercelResponse,
  user: Awaited<ReturnType<typeof requireAdmin>>
): Promise<void> {
  const input = moderationSchema.parse(bodyOf(req));
  const supabase = service();
  const now = new Date().toISOString();
  const fields = {
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_label: nullableText(input.locationLabel),
    comment: nullableText(input.comment),
    status: input.action === 'approve' ? 'approved' : 'rejected',
    approved_at: input.action === 'approve' ? now : null,
    approved_by: input.action === 'approve' ? user.id : null,
    rejected_at: input.action === 'reject' ? now : null,
    rejected_by: input.action === 'reject' ? user.id : null
  };
  const { data, error } = await supabase
    .from('submissions')
    .update(fields)
    .eq('id', input.id)
    .not('upload_completed_at', 'is', null)
    .select('id,status')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Proposition introuvable.', 'submission_not_found');
  await audit(user, `submission.${input.action}`, 'submission', input.id);
  json(res, 200, { submission: data });
}

async function remove(
  req: VercelRequest,
  res: VercelResponse,
  user: Awaited<ReturnType<typeof requireAdmin>>
): Promise<void> {
  const id = String((bodyOf(req) as { id?: unknown } | undefined)?.id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Identifiant invalide.', 'invalid_id');
  const supabase = service();
  const { data: row, error: rowError } = await supabase
    .from('submissions')
    .select('id,storage_bucket,storage_path,status')
    .eq('id', id)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row) throw new HttpError(404, 'Proposition introuvable.', 'submission_not_found');

  const { error: storageError } = await supabase.storage
    .from(row.storage_bucket)
    .remove([row.storage_path]);
  if (storageError) throw storageError;
  const { error: deleteError } = await supabase.from('submissions').delete().eq('id', id);
  if (deleteError) throw deleteError;
  await audit(user, 'submission.delete', 'submission', id, { previousStatus: row.status });
  json(res, 200, { deleted: true });
}
