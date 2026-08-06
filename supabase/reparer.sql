-- ============================================================================
-- RÉPARER LA FIN DE LA MIGRATION
-- ----------------------------------------------------------------------------
-- La grande migration s'est arrêtée dans ses dernières lignes : tout le schéma
-- est en place, mais deux choses manquent.
--
--   1. le serveur n'a plus le droit d'exécuter la fonction anti-spam.
--      La migration retire les droits à tout le monde, puis rend le sien au
--      backend ; seule la première moitié est passée. Symptôme : le dépôt
--      répond « quota_unavailable · indice 42501 ».
--
--   2. le bucket de stockage « earth » n'existe pas. Supabase interdit
--      désormais de l'écrire depuis cet éditeur — c'est probablement ce qui
--      a interrompu le script. L'API le crée maintenant toute seule au
--      premier dépôt, donc ce n'est plus bloquant.
--
-- Ce fichier est REJOUABLE : le relancer ne casse rien.
-- À coller dans Supabase → SQL Editor → Run.
-- ============================================================================

-- 1 · les droits d'exécution ------------------------------------------------

revoke all on function public.consume_submission_quota(text)
  from public, anon, authenticated;
grant execute on function public.consume_submission_quota(text) to service_role;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- 2 · le bucket privé, si cet éditeur y a droit -----------------------------

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('earth', 'earth', false, 8388608,
          array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
  on conflict (id) do update set
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
  raise notice 'bucket « earth » en place';
exception
  when others then
    raise warning 'bucket non créé ici (%) — l''API le créera au premier dépôt', sqlerrm;
end;
$$;

-- 3 · vérifier ---------------------------------------------------------------
-- Les trois lignes ci-dessous doivent répondre, dans l'ordre :
--   has_function_privilege → true
--   le bucket earth        → public = false   (ou aucune ligne : l'API s'en charge)
--   les statuts            → aucune ligne, ou vos propositions

select has_function_privilege(
         'service_role',
         'public.consume_submission_quota(text)',
         'execute'
       ) as le_serveur_peut_verifier_le_quota;

select id, public, file_size_limit from storage.buckets where id = 'earth';

select status, count(*) from public.submissions group by status;
