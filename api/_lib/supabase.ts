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

/**
 * Le bucket privé des captures, créé au besoin.
 *
 * La migration l'installe par `insert into storage.buckets`, mais
 * Supabase interdit désormais cette écriture depuis l'éditeur SQL :
 * le script s'arrête à sa dernière ligne, tout le reste est en place,
 * et le dépôt échoue sans que rien ne l'explique. La clé service_role
 * a le droit de le créer par l'API Storage, elle : on le fait ici, une
 * fois, plutôt que de demander un geste manuel de plus.
 *
 * Idempotent : si le bucket existe, on n'y touche pas — surtout pas à
 * `public`, qui doit rester false.
 */
let bucketVerifie = false;

export async function assurerBucket(nom = 'earth'): Promise<void> {
  if (bucketVerifie) return;
  const supabase = service();

  const { error: lecture } = await supabase.storage.getBucket(nom);
  if (!lecture) { bucketVerifie = true; return; }

  const { error: creation } = await supabase.storage.createBucket(nom, {
    public: false,
    fileSizeLimit: 8_388_608,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  });
  // « existe déjà » = une autre requête l'a créé entre-temps : très bien.
  if (creation && !/exist/i.test(creation.message)) {
    console.error('[api] création du bucket impossible :', creation.message);
    throw new HttpError(
      503,
      'Le stockage des captures n’est pas prêt.',
      'storage_unavailable'
    );
  }
  console.warn(`[api] bucket « ${nom} » créé (privé, 8 Mo, images seules)`);
  bucketVerifie = true;
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
