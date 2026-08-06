# Mettre le site en ligne — 4 étapes

Rien à comprendre : suis les étapes dans l’ordre, copie-colle.
Ce qui était automatisable est déjà fait.

| étape | où | fait ? |
|---|---|---|
| 1. Base de données | Supabase | ✅ **déjà fait** |
| 2. Compte administrateur | Supabase | à faire — 1 min |
| 3. Envoyer le code | Terminal | à faire — 1 commande |
| 4. Brancher Vercel | Vercel | à faire — 5 min |

---

## Étape 1 — Base de données ✅ déjà fait

Tables, sécurité, bucket privé, quotas : tout est en place sur le projet
Supabase `jhdwyiknkoqdxflafwmx`. Rien à faire.

---

## Étape 2 — Créer ton compte administrateur

C’est le compte avec lequel tu valideras les captures.

1. Supabase → menu de gauche → **Authentication** → **Users**
2. bouton vert **Add user** → **Create new user**
3. Email : `kara.garnier27@gmail.com`
4. Password : choisis-en un, note-le
5. coche **Auto Confirm User**
6. **Create user**

C’est tout. Le rôle administrateur t’est donné automatiquement, ton adresse
étant déjà autorisée dans la base.

---

## Étape 3 — Envoyer le code sur GitHub

Ouvre un terminal (PowerShell) et colle **une seule ligne** :

```bash
cd "C:/Users/karac/Desktop/EARTH VIEW"; git remote add origin https://github.com/vokinchni27/dont-break-my-earth.git; git push -u origin codex/collaborative-platform:main
```

Une fenêtre GitHub peut s’ouvrir pour te connecter : accepte.
L’envoi dure quelques minutes — il y a 150 Mo d’images.

Cette commande envoie la branche de travail sous le nom `main`, qui est celle
que Vercel déploiera. C’est normal qu’elle porte un autre nom en local.

---

## Étape 4 — Brancher Vercel

1. vercel.com → **Add New…** → **Project**
2. **Import** le dépôt `dont-break-my-earth`
3. ne touche à aucun réglage de build (le projet n’a pas besoin d’être compilé)
4. déplie **Environment Variables** et ajoute ces **9 lignes**, une par une :

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://jhdwyiknkoqdxflafwmx.supabase.co` |
| `SUPABASE_ANON_KEY` | *voir ci-dessous* |
| `SUPABASE_SERVICE_ROLE_KEY` | *voir ci-dessous* |
| `PUBLIC_SITE_URL` | `https://dontbreakmyearth.com` |
| `RATE_LIMIT_SECRET` | *voir le message de Claude* |
| `UPLOAD_TOKEN_SECRET` | *voir le message de Claude* |
| `MAX_UPLOAD_BYTES` | `8388608` |
| `SIGNED_URL_TTL_SECONDS` | `3600` |
| `GOOGLE_EARTH_URL` | `https://earth.google.com/web/` |

**Où trouver les deux clés Supabase :**
Supabase → **Project Settings** (roue dentée) → **API Keys**

- `SUPABASE_ANON_KEY` = la clé **anon / public** (ou `publishable`)
- `SUPABASE_SERVICE_ROLE_KEY` = la clé **service_role** — cliquer sur *Reveal*

> ⚠️ La clé `service_role` donne tous les droits sur la base.
> Elle ne va **que** dans Vercel. Jamais dans le code, jamais dans un message,
> jamais sur GitHub.

5. **Deploy**

---

## Ensuite

- le site public : l’URL que Vercel te donne
- ton tableau de bord : cette même URL suivie de `/admin`

Pour le nom de domaine `dontbreakmyearth.com` : Vercel → ton projet →
**Settings** → **Domains** → ajouter le domaine, puis suivre les instructions
DNS chez ton registrar.

---

## Vérifier que tout marche

1. ouvre le site, clique **ajouter votre morceau de Terre**
2. dépose une capture, remplis latitude et longitude, envoie
3. le message doit dire « reçue — elle attend d’être validée »
4. **elle ne doit apparaître nulle part sur le site** — c’est voulu
5. va sur `/admin`, connecte-toi, la capture est là
6. clique **valider**
7. recharge le site : elle a rejoint l’archive

Si l’étape 3 affiche une erreur, c’est presque toujours une variable
d’environnement mal collée. Vercel → Settings → Environment Variables,
puis **Redeploy**.
