import type { VercelRequest, VercelResponse } from '../_lib/vercel.js';
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
import { contentSchema, contentUpdateSchema, nullableText } from '../_lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    method(req, ['GET', 'POST', 'PATCH', 'DELETE']);
    noStore(res);
    sameOrigin(req);
    const user = await requireAdmin(req);
    if (req.method === 'GET') return await list(res);
    if (req.method === 'POST') return await create(req, res, user);
    if (req.method === 'PATCH') return await update(req, res, user);
    return await remove(req, res, user);
  } catch (error) {
    handleError(res, error);
  }
}

async function list(res: VercelResponse): Promise<void> {
  const { data, error } = await service()
    .from('site_content')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  json(res, 200, { content: data ?? [] });
}

async function create(
  req: VercelRequest,
  res: VercelResponse,
  user: Awaited<ReturnType<typeof requireAdmin>>
): Promise<void> {
  const input = contentSchema.parse(bodyOf(req));
  const { data, error } = await service().from('site_content').insert({
    key: input.key,
    type: input.type,
    title: nullableText(input.title),
    value: input.value,
    sort_order: input.sortOrder,
    is_published: input.isPublished,
    metadata: input.metadata,
    updated_by: user.id
  }).select('*').single();
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'Cette clé existe déjà.', 'duplicate_key');
    throw error;
  }
  await audit(user, 'content.create', 'site_content', data.id, { key: data.key });
  json(res, 201, { content: data });
}

async function update(
  req: VercelRequest,
  res: VercelResponse,
  user: Awaited<ReturnType<typeof requireAdmin>>
): Promise<void> {
  const input = contentUpdateSchema.parse(bodyOf(req));
  const fields: Record<string, unknown> = { updated_by: user.id };
  if (input.key !== undefined) fields.key = input.key;
  if (input.type !== undefined) fields.type = input.type;
  if (input.title !== undefined) fields.title = nullableText(input.title);
  if (input.value !== undefined) fields.value = input.value;
  if (input.sortOrder !== undefined) fields.sort_order = input.sortOrder;
  if (input.isPublished !== undefined) fields.is_published = input.isPublished;
  if (input.metadata !== undefined) fields.metadata = input.metadata;

  const { data, error } = await service().from('site_content')
    .update(fields)
    .eq('id', input.id)
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'Cette clé existe déjà.', 'duplicate_key');
    throw error;
  }
  if (!data) throw new HttpError(404, 'Contenu introuvable.', 'content_not_found');
  await audit(user, 'content.update', 'site_content', data.id, { key: data.key });
  json(res, 200, { content: data });
}

async function remove(
  req: VercelRequest,
  res: VercelResponse,
  user: Awaited<ReturnType<typeof requireAdmin>>
): Promise<void> {
  const id = String((bodyOf(req) as { id?: unknown } | undefined)?.id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Identifiant invalide.', 'invalid_id');
  const { data, error } = await service().from('site_content')
    .delete()
    .eq('id', id)
    .select('id,key')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Contenu introuvable.', 'content_not_found');
  await audit(user, 'content.delete', 'site_content', id, { key: data.key });
  json(res, 200, { deleted: true });
}
