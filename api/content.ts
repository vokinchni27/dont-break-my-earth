import type { VercelRequest, VercelResponse } from './_lib/vercel.js';
import { handleError, json, method } from './_lib/http.js';
import { service } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    method(req, ['GET']);
    const { data, error } = await service()
      .from('site_content')
      .select('id,key,type,title,value,sort_order,metadata,updated_at')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    json(res, 200, { content: data ?? [] });
  } catch (error) {
    handleError(res, error);
  }
}
