-- ============================================================
-- EARTH — l'archive collective
-- ------------------------------------------------------------
-- A coller dans Supabase > SQL Editor > New query > Run.
-- Projet : gabY SCRYPTS (jhdwyiknkoqdxflafwmx)
--
-- Tout est prefixe earth_ : aucune table de SCRYPTS n'est
-- touchee. Pour deplacer EARTH dans son propre projet plus tard,
-- il suffira de rejouer ce fichier ailleurs et de changer deux
-- lignes dans js/config.js.
-- ============================================================


-- ------------------------------------------------------------
-- 1. LA TABLE
-- ------------------------------------------------------------

create table if not exists public.earth_contributions (
  id          uuid primary key default gen_random_uuid(),
  cree_le     timestamptz not null default now(),
  chemin      text not null,              -- chemin dans le bucket
  lieu        text,                       -- rempli a la moderation
  lat         text,                       -- coordonnees DMS relevees
  lon         text,
  lat_dec     double precision,           -- degres decimaux, calculables
  lon_dec     double precision,
  auteur      text,                       -- signature libre, facultative
  largeur     integer,
  hauteur     integer,
  poids       integer,
  statut      text not null default 'en_attente'
              check (statut in ('en_attente','retenue','ecartee')),
  note        text,
  vue_le      timestamptz
);

create index if not exists earth_contributions_statut_idx
  on public.earth_contributions (statut, cree_le desc);

alter table public.earth_contributions enable row level security;


-- ------------------------------------------------------------
-- 2. QUI A LE DROIT DE QUOI
-- ------------------------------------------------------------

-- n'importe qui peut proposer — mais seulement « en attente ».
-- Personne ne peut s'auto-publier.
drop policy if exists "earth proposer" on public.earth_contributions;
create policy "earth proposer" on public.earth_contributions
  for insert to anon, authenticated
  with check (statut = 'en_attente');

-- le public ne lit que ce qui a ete retenu
drop policy if exists "earth lire retenues" on public.earth_contributions;
create policy "earth lire retenues" on public.earth_contributions
  for select to anon, authenticated
  using (statut = 'retenue');

-- la moderatrice voit tout, y compris ce qui attend
drop policy if exists "earth moderation lecture" on public.earth_contributions;
create policy "earth moderation lecture" on public.earth_contributions
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'kara.garnier27@gmail.com');

-- et elle seule decide
drop policy if exists "earth moderation ecriture" on public.earth_contributions;
create policy "earth moderation ecriture" on public.earth_contributions
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'kara.garnier27@gmail.com')
  with check (auth.jwt() ->> 'email' = 'kara.garnier27@gmail.com');


-- ------------------------------------------------------------
-- 3. LE STOCKAGE
-- ------------------------------------------------------------
-- Bucket public en lecture (les images doivent s'afficher), mais
-- l'ecriture est limitee au dossier propositions/, aux images, et
-- a 8 Mo par fichier.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'earth', 'earth', true, 8388608,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "earth deposer" on storage.objects;
create policy "earth deposer" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'earth'
    and (storage.foldername(name))[1] = 'propositions'
  );

drop policy if exists "earth lire fichiers" on storage.objects;
create policy "earth lire fichiers" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'earth');

-- seule la moderatrice peut effacer une proposition
drop policy if exists "earth effacer" on storage.objects;
create policy "earth effacer" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'earth'
    and auth.jwt() ->> 'email' = 'kara.garnier27@gmail.com'
  );


-- ------------------------------------------------------------
-- 4. VERIFICATION
-- ------------------------------------------------------------
-- select statut, count(*) from public.earth_contributions group by statut;
