# Don’t Break My Earth

Plateforme artistique collaborative construite autour de captures Google Earth.

Le projet conserve le moteur visuel historique d’**EARTH — archive vivante** :
grille organique, compositions génératives, coordonnées, gestes, recadrage et
archive locale. Une couche collaborative sécurisée ajoute le dépôt public, la
modération, un mini-CMS et la publication automatique des captures validées.

## Ce qui est inclus

- parcours public guidé vers Google Earth, puis dépôt image + coordonnées + lieu
  + commentaire + signature facultative ;
- fichiers JPG, PNG, WebP ou AVIF limités à 8 Mo ;
- bucket Supabase **privé** : aucune image en attente n’a d’URL publique ;
- statut `pending`, `approved` ou `rejected` ;
- affichage automatique des captures `approved` dans le moteur artistique ;
- espace `/admin` protégé par Supabase Auth, email + mot de passe ;
- prévisualisation, validation, refus et suppression définitive ;
- mini-CMS pour introductions, paragraphes, citations, sections et fragments ;
- politiques RLS, rôles, journal administratif et quota anti-spam ;
- fonctions Vercel écrites en TypeScript strict ;
- migration de l’ancienne table `earth_contributions` sans perte de données.

## Architecture

```text
.
├── index.html                     œuvre publique existante
├── moderation.html                dashboard administrateur
├── css/
│   ├── earth.css                  identité et interactions de l’œuvre
│   └── admin.css                  planche de contact administrative
├── js/
│   ├── config.js                  réglages artistiques
│   ├── contribute.js              parcours de contribution
│   ├── content.js                 chargement et rendu du mini-CMS
│   ├── supabase.js                auth navigateur + passerelle API
│   ├── admin.js                   dashboard
│   └── …                          moteur visuel historique, inchangé
├── api/
│   ├── config.ts                  configuration publique non secrète
│   ├── content.ts                 contenus publiés
│   ├── submissions.ts             liste publique + dépôt signé
│   ├── admin/
│   │   ├── submissions.ts         modération et suppression
│   │   └── content.ts             CRUD du mini-CMS
│   └── _lib/                      auth, validation, sécurité, Supabase
├── supabase/
│   └── migrations/
│       └── 202608060001_collaborative_platform.sql
├── tests/                         tests du contrat de validation
├── vercel.json                    routes et en-têtes de sécurité
├── .env.example                   variables documentées
└── package.json                   vérification TypeScript et tests
```

Le frontend artistique reste en JavaScript classique et sous `window.EARTH` afin
de préserver l’ouverture locale en double-clic et d’éviter une réécriture risquée
des vingt modules existants. Toute la nouvelle logique sensible est isolée dans
des fonctions TypeScript strictes. C’est un compromis volontaire entre stabilité
de l’œuvre et qualité du backend.

## Prérequis

- Node.js 22 ou supérieur ;
- un projet Supabase ;
- un compte Vercel ;
- un dépôt GitHub pour le déploiement continu.

## État de la base — déjà fait

La migration a été **appliquée le 06/08/2026** sur le projet Supabase
`jhdwyiknkoqdxflafwmx` (gabY SCRYPTS). Vérifié :

| élément | état |
|---|---|
| tables | `submissions`, `site_content`, `user_profiles`, `admin_allowlist`, `submission_rate_limits`, `admin_audit_logs` |
| statuts | `pending`, `approved`, `rejected`, `deleted` |
| bucket `earth` | **privé**, 8 Mo, images seules |
| policies RLS | 8 sur les tables + 4 sur `storage.objects` |
| allowlist admin | `kara.garnier27@gmail.com` |
| contenus CMS | 3 lignes de départ |

Il reste à **créer le compte administrateur** dans
Supabase → Authentication → Users (email + mot de passe). Le déclencheur
`on_auth_user_created` lui donnera le rôle `admin` automatiquement, puisque
l'adresse est dans l'allowlist.

## Les textes

Tous les textes visibles vivent dans **`js/textes.js`**, et nulle part ailleurs.
Le HTML de l'administration ne porte que des clés (`data-t="admin.entrer"`).

- la liste complète, prête à être réécrite : **`TEXTES.md`** (144 textes) ;
- la régénérer après modification : `node tools/lister-textes.mjs` ;
- une ligne de `site_content` dont la `key` vaut exactement une clé de
  `textes.js` **remplace** le texte statique au chargement, sans redéployer.
  C'est l'abstraction CMS : le statique est le défaut, la base est la surcharge.

## Installation locale

```bash
npm install
```

Copier `.env.example` vers `.env.local`, puis renseigner les variables.

Exécuter ensuite la migration complète
`supabase/migrations/202608060001_collaborative_platform.sql` dans
**Supabase → SQL Editor**.

Pour tester la plateforme complète avec ses fonctions API :

```bash
npx vercel dev
```

Ouvrir l’URL locale affichée. Le simple double-clic sur `index.html` reste
possible pour l’œuvre et l’archive locale, mais le dépôt, le CMS et
l’administration nécessitent un serveur Vercel local ou distant.

## Variables d’environnement

| variable | secret | rôle |
|---|---:|---|
| `SUPABASE_URL` | non | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | non | clé publiable utilisée uniquement par Supabase Auth dans le navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | **oui** | accès serveur à la base et au Storage ; ne jamais l’exposer dans le frontend |
| `PUBLIC_SITE_URL` | non | origine canonique autorisée, par exemple `https://dontbreakmyearth.com` |
| `RATE_LIMIT_SECRET` | **oui** | HMAC des empreintes anti-spam ; 32 caractères minimum |
| `UPLOAD_TOKEN_SECRET` | **oui** | protection des jetons de finalisation ; distinct du précédent |
| `MAX_UPLOAD_BYTES` | non | taille maximale, `8388608` par défaut et au maximum |
| `SIGNED_URL_TTL_SECONDS` | non | durée des aperçus privés, `3600` par défaut |
| `GOOGLE_EARTH_URL` | non | lien du bouton, `https://earth.google.com/web/` par défaut |

Générer deux secrets différents, par exemple avec un gestionnaire de mots de
passe ou `openssl rand -hex 32`. Ne jamais versionner `.env.local`.

## Configuration Supabase

### 1. Schéma et RLS

La migration crée :

- `submissions` : métadonnées, coordonnées, workflow et attribution ;
- `site_content` : mini-CMS ;
- `user_profiles` : profils et rôle `admin` / `editor` ;
- `admin_allowlist` : adresses autorisées à devenir administratrices ;
- `submission_rate_limits` : quota anti-spam ;
- `admin_audit_logs` : journal des actions sensibles ;
- le bucket privé `earth`, limité à 8 Mo et aux formats autorisés.

Les anciennes lignes de `earth_contributions` sont copiées dans `submissions` :

| ancien statut | nouveau statut |
|---|---|
| `en_attente` | `pending` |
| `retenue` | `approved` |
| `ecartee` | `rejected` |

Le bucket historique `earth` est rendu privé pendant la migration. Les images
approuvées sont ensuite servies par URLs signées ; les images en attente ne sont
jamais signées pour le public.

### 2. Compte administrateur

Dans **Supabase → Authentication → Users**, créer un utilisateur avec email et
mot de passe. L’adresse `kara.garnier27@gmail.com` est incluse par défaut dans
`admin_allowlist`. Pour utiliser une autre adresse :

```sql
insert into public.admin_allowlist (email)
values ('admin@example.com')
on conflict do nothing;
```

Puis créer l’utilisateur, ou le promouvoir s’il existe déjà :

```sql
update public.user_profiles
set role = 'admin'
where email = 'admin@example.com';
```

Le dashboard se trouve sur `/admin` ou `/moderation.html`.

### 3. Vérifications après migration

```sql
select status, count(*) from public.submissions group by status;
select id, public, file_size_limit from storage.buckets where id = 'earth';
select email, role from public.user_profiles order by created_at;
```

La colonne `public` du bucket `earth` doit impérativement être `false`.

## Workflow d’un dépôt

**Aucune capture n'apparaît nulle part avant validation** — pas même à celui
qui vient de l'envoyer. Il n'y a plus d'affichage local optimiste.

```text
visiteur
  → demande une URL de dépôt limitée à un chemin aléatoire
  → envoie directement le fichier au bucket privé Supabase
  → l’API vérifie l’objet réellement stocké
  → submission.status = pending
  → admin valide
  → submission.status = approved
  → l’API publique crée une URL temporaire
  → la capture rejoint automatiquement l’archive vivante
```

Le fichier ne traverse pas une fonction Vercel : Vercel limite ses corps de
requête, tandis que l’URL de dépôt Supabase autorise un envoi direct et borné.
Le bucket vérifie de nouveau le poids et le type MIME.

## Sécurité

- bucket privé et aucune politique de lecture anonyme sur `storage.objects` ;
- clé `service_role` uniquement côté serveur ;
- URLs signées créées uniquement pour une capture approuvée ou un admin ;
- validation Zod côté serveur, bornes SQL, types MIME et signatures binaires réelles ;
- quota de cinq demandes de dépôt par heure et par empreinte HMAC ;
- champ piège et durée minimale de remplissage contre les robots simples ;
- requêtes Supabase paramétrées, sans concaténation SQL utilisateur ;
- contrôle d’origine, CSP, protection anti-iframe et `noindex` sur l’admin ;
- vérification du JWT puis du rôle `admin` à chaque route administrative ;
- journal des validations, refus, suppressions et modifications CMS.

Un contrôle côté navigateur améliore le retour utilisateur, mais la base, le
Storage et les fonctions API répètent toujours les vérifications importantes.

## Vérification avant livraison

```bash
npm run build
```

Cette commande vérifie :

1. la syntaxe de tous les modules JavaScript historiques ;
2. le typage TypeScript strict des fonctions Vercel ;
3. les tests de validation des fichiers, coordonnées et contenus CMS.

## Déploiement GitHub + Vercel

1. Créer un dépôt GitHub privé ou public et pousser la branche principale.
2. Dans Vercel, **Add New → Project**, puis importer ce dépôt.
3. Laisser **Framework Preset** sur `Other`.
4. Ajouter toutes les variables de `.env.example` pour Production et Preview.
5. Déployer. Vercel détecte les fichiers statiques et les fonctions `api/*.ts`.
6. Vérifier `/`, `/api/config` puis `/admin`.
7. Dans **Project → Domains**, ajouter `dontbreakmyearth.com` et suivre les
   enregistrements DNS indiqués par Vercel.
8. Mettre `PUBLIC_SITE_URL=https://dontbreakmyearth.com`, puis redéployer.

Chaque push sur la branche de production déclenche ensuite un nouveau
déploiement. Les pull requests obtiennent une URL de prévisualisation.

## Faire évoluer le projet

Le schéma prévoit déjà `media_type` et `metadata` côté CMS. Pour ajouter vidéos,
cartes, collections, tags ou recherche :

- créer une nouvelle migration numérotée ;
- étendre les validateurs de `api/_lib/validation.ts` ;
- ajouter un module frontend isolé, sans alourdir `js/main.js` ;
- conserver les accès Supabase dans `api/` ;
- ajouter un test du nouveau contrat avant d’activer la fonctionnalité.

Les modules artistiques restent séparés : `gestures` émet des verbes,
`interactions` agit sur `stage`, `director` demande une partition à `layouts` et
des médias à `loader`. Cette séparation doit être conservée.

## Archive locale

Les captures historiques vivent dans `images/`. Pour les réindexer :

```bash
python tools/derive-images.py
node tools/index-images.mjs
```

Les coordonnées locales se trouvent dans `images/coordinates.json`. Le moteur
continue de fonctionner même si Supabase est temporairement indisponible : la
partie collaborative se dégrade silencieusement, jamais l’œuvre.
