-- ============================================================================
-- DON'T BREAK MY EARTH — plateforme collaborative
-- Migration initiale versionnée, relançable sans perte de données.
-- ============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.submission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_kind as enum ('intro', 'paragraph', 'quote', 'section', 'fragment');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_role as enum ('editor', 'admin');
exception when duplicate_object then null;
end $$;

-- --------------------------------------------------------------------------
-- Administration et profils Supabase Auth
-- --------------------------------------------------------------------------

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

insert into public.admin_allowlist (email)
values ('kara.garnier27@gmail.com')
on conflict (email) do nothing;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where id = check_user and role = 'admin'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.app_role;
begin
  select case when exists (
    select 1 from public.admin_allowlist a
    where a.email = lower(coalesce(new.email, ''))
  ) then 'admin'::public.app_role else 'editor'::public.app_role end
  into next_role;

  insert into public.user_profiles (id, email, display_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    next_role
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.user_profiles.display_name),
    role = case
      when excluded.role = 'admin' then 'admin'::public.app_role
      else public.user_profiles.role
    end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_auth_user();

insert into public.user_profiles (id, email, display_name, role)
select
  u.id,
  lower(coalesce(u.email, '')),
  nullif(u.raw_user_meta_data ->> 'display_name', ''),
  case when a.email is not null then 'admin'::public.app_role else 'editor'::public.app_role end
from auth.users u
left join public.admin_allowlist a on a.email = lower(coalesce(u.email, ''))
on conflict (id) do update set
  email = excluded.email,
  role = case
    when excluded.role = 'admin' then 'admin'::public.app_role
    else public.user_profiles.role
  end,
  updated_at = now();

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute procedure public.touch_updated_at();

-- --------------------------------------------------------------------------
-- Propositions
-- --------------------------------------------------------------------------

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'earth',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  media_type text not null default 'image' check (media_type in ('image')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8388608),
  width integer check (width is null or (width > 0 and width <= 20000)),
  height integer check (height is null or (height > 0 and height <= 20000)),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  location_label text check (location_label is null or char_length(location_label) <= 120),
  comment text check (comment is null or char_length(comment) <= 1000),
  author_name text check (author_name is null or char_length(author_name) <= 80),
  status public.submission_status not null default 'pending',
  upload_token_hash text,
  upload_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  source_legacy_id uuid unique
);

create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);
create index if not exists submissions_upload_cleanup_idx
  on public.submissions (upload_completed_at, created_at)
  where status = 'pending';

drop trigger if exists submissions_touch_updated_at on public.submissions;
create trigger submissions_touch_updated_at
before update on public.submissions
for each row execute procedure public.touch_updated_at();

-- Migration douce des contributions déjà présentes. Le bucket historique
-- devient privé plus bas ; les captures approuvées seront servies par URL signée.
do $$
begin
  if to_regclass('public.earth_contributions') is not null then
    execute $migration$
      insert into public.submissions (
        storage_bucket, storage_path, original_filename, mime_type, size_bytes,
        width, height, latitude, longitude, location_label, comment, author_name,
        status, upload_completed_at, created_at, approved_at, rejected_at,
        source_legacy_id
      )
      select
        'earth',
        chemin,
        coalesce(nullif(regexp_replace(chemin, '^.*/', ''), ''), id::text || '.jpg'),
        case
          when lower(chemin) like '%.png' then 'image/png'
          when lower(chemin) like '%.webp' then 'image/webp'
          when lower(chemin) like '%.avif' then 'image/avif'
          else 'image/jpeg'
        end,
        greatest(1, least(coalesce(poids, 1), 8388608)),
        largeur,
        hauteur,
        case when lat_dec between -90 and 90 then lat_dec else null end,
        case when lon_dec between -180 and 180 then lon_dec else null end,
        left(lieu, 120),
        left(note, 1000),
        left(auteur, 80),
        case statut
          when 'retenue' then 'approved'::public.submission_status
          when 'ecartee' then 'rejected'::public.submission_status
          else 'pending'::public.submission_status
        end,
        cree_le,
        cree_le,
        case when statut = 'retenue' then coalesce(vue_le, cree_le) else null end,
        case when statut = 'ecartee' then coalesce(vue_le, cree_le) else null end,
        id
      from public.earth_contributions
      on conflict (source_legacy_id) do nothing
    $migration$;
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- Mini-CMS
-- --------------------------------------------------------------------------

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  type public.content_kind not null default 'paragraph',
  title text check (title is null or char_length(title) <= 160),
  value text not null check (char_length(value) <= 12000),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists site_content_public_order_idx
  on public.site_content (is_published, sort_order, created_at);

drop trigger if exists site_content_touch_updated_at on public.site_content;
create trigger site_content_touch_updated_at
before update on public.site_content
for each row execute procedure public.touch_updated_at();

insert into public.site_content (key, type, title, value, sort_order, is_published)
values
  ('introduction', 'intro', 'DON’T BREAK MY EARTH',
   'Une archive vivante composée de morceaux de Terre rapportés par celles et ceux qui la regardent.', 10, true),
  ('fragment.la-terre-ne-pose-pas', 'fragment', null, 'la Terre ne pose pas', 100, true),
  ('fragment.tu-es-dedans', 'fragment', null, 'tu es dedans aussi', 110, true)
on conflict (key) do nothing;

-- --------------------------------------------------------------------------
-- Anti-spam et journal administratif
-- --------------------------------------------------------------------------

create table if not exists public.submission_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  last_attempt_at timestamptz not null default now()
);

create index if not exists submission_rate_limits_last_attempt_idx
  on public.submission_rate_limits (last_attempt_at);

create or replace function public.consume_submission_quota(p_fingerprint text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempts integer;
begin
  if p_fingerprint is null or char_length(p_fingerprint) < 16 then
    return false;
  end if;

  insert into public.submission_rate_limits (
    fingerprint, window_started_at, attempts, last_attempt_at
  ) values (p_fingerprint, now(), 1, now())
  on conflict (fingerprint) do update set
    attempts = case
      when public.submission_rate_limits.window_started_at < now() - interval '1 hour'
        then 1
      else public.submission_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.submission_rate_limits.window_started_at < now() - interval '1 hour'
        then now()
      else public.submission_rate_limits.window_started_at
    end,
    last_attempt_at = now()
  returning attempts into current_attempts;

  delete from public.submission_rate_limits
  where last_attempt_at < now() - interval '2 days';

  return current_attempts <= 5;
end;
$$;

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) <= 80),
  entity_type text not null check (char_length(entity_type) <= 80),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------

alter table public.admin_allowlist enable row level security;
alter table public.user_profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.site_content enable row level security;
alter table public.submission_rate_limits enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "admins manage allowlist" on public.admin_allowlist;
create policy "admins manage allowlist" on public.admin_allowlist
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile" on public.user_profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admins manage profiles" on public.user_profiles;
create policy "admins manage profiles" on public.user_profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "public read approved submissions" on public.submissions;
create policy "public read approved submissions" on public.submissions
for select to anon, authenticated
using (status = 'approved' and upload_completed_at is not null);

drop policy if exists "admins manage submissions" on public.submissions;
create policy "admins manage submissions" on public.submissions
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "public read published content" on public.site_content;
create policy "public read published content" on public.site_content
for select to anon, authenticated
using (is_published = true);

drop policy if exists "admins manage content" on public.site_content;
create policy "admins manage content" on public.site_content
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "admins read audit logs" on public.admin_audit_logs;
create policy "admins read audit logs" on public.admin_audit_logs
for select to authenticated
using ((select public.is_admin()));

-- Aucun accès direct n'est accordé à submission_rate_limits. Seule la fonction
-- SECURITY DEFINER ci-dessus et le backend service_role peuvent la modifier.
revoke all on public.submission_rate_limits from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
grant select, insert, update, delete on public.admin_audit_logs to service_role;
grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;
revoke all on function public.consume_submission_quota(text) from public, anon, authenticated;
grant execute on function public.consume_submission_quota(text) to service_role;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Storage privé
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'earth',
  'earth',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if to_regclass('public.earth_contributions') is not null then
    execute 'drop policy if exists "earth proposer" on public.earth_contributions';
    execute 'drop policy if exists "earth lire retenues" on public.earth_contributions';
    execute 'drop policy if exists "earth moderation lecture" on public.earth_contributions';
    execute 'drop policy if exists "earth moderation ecriture" on public.earth_contributions';
  end if;
end;
$$;

drop policy if exists "earth deposer" on storage.objects;
drop policy if exists "earth lire fichiers" on storage.objects;
drop policy if exists "earth effacer" on storage.objects;
drop policy if exists "earth admin insert" on storage.objects;
drop policy if exists "earth admin read" on storage.objects;
drop policy if exists "earth admin update" on storage.objects;
drop policy if exists "earth admin delete" on storage.objects;

create policy "earth admin insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'earth' and (select public.is_admin()));

create policy "earth admin read" on storage.objects
for select to authenticated
using (bucket_id = 'earth' and (select public.is_admin()));

create policy "earth admin update" on storage.objects
for update to authenticated
using (bucket_id = 'earth' and (select public.is_admin()))
with check (bucket_id = 'earth' and (select public.is_admin()));

create policy "earth admin delete" on storage.objects
for delete to authenticated
using (bucket_id = 'earth' and (select public.is_admin()));

-- Vérifications utiles après exécution :
-- select status, count(*) from public.submissions group by status;
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'earth';
-- select email, role from public.user_profiles order by created_at;
