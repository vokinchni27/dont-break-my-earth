import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { VercelRequest } from './vercel.js';
import { env } from './env.js';
import { header, HttpError } from './http.js';

let serviceClient: SupabaseClient | undefined;

export function service(): SupabaseClient {
  const cfg = env();
  serviceClient ??= createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return serviceClient;
}

export async function requireAdmin(req: VercelRequest): Promise<User> {
  const authorization = header(req, 'authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new HttpError(401, 'Connexion requise.', 'authentication_required');

  const supabase = service();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    throw new HttpError(401, 'Session expirée.', 'invalid_session');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError || profile?.role !== 'admin') {
    throw new HttpError(403, 'Accès administrateur requis.', 'admin_required');
  }
  return authData.user;
}

export async function audit(
  user: User,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await service().from('admin_audit_logs').insert({
    actor_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details
  });
  if (error) console.error('[audit]', error.message);
}
