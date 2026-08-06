# Mettre le site en ligne

Suis les étapes dans l’ordre. Tout ce qui pouvait être automatisé l’a été.

| # | étape | où | état |
|---|---|---|---|
| 1 | Base de données | Supabase | ✅ fait |
| 2 | Envoyer le code | GitHub | ✅ fait |
| 3 | **Importer le dépôt dans Vercel** | Vercel | ⬅️ **à faire** |
| 4 | Créer ton compte administrateur | Supabase | à faire — 1 min |

---

## 1 · Base de données ✅ fait

Tables, sécurité, bucket privé, quotas, allowlist : tout est en place sur le
projet Supabase `jhdwyiknkoqdxflafwmx`. Rien à faire.

---

## 2 · Le code sur GitHub ✅ fait

Dépôt `vokinchni27/dont-break-my-earth`, branche `main`. Il contient le moteur,
les 130 captures, leurs déclinaisons et les fonctions `api/`.

Pour envoyer une mise à jour plus tard :

```bash
cd "C:/Users/karac/Desktop/EARTH VIEW"; git push origin HEAD:main
```

---

## 3 · Importer le dépôt dans Vercel ⬅️ à faire

Aucun projet Vercel ne lit encore ce dépôt — GitHub n’enregistre aucun
déploiement. C’est la seule chose qui manque.

1. **vercel.com** → bouton **Add New…** → **Project**
2. dans la liste des dépôts, trouve **`dont-break-my-earth`** → **Import**
   - s’il n’apparaît pas : **Adjust GitHub App Permissions**, puis autorise
     Vercel à voir ce dépôt
3. **ne touche à aucun réglage de build.** Tout est déjà fixé dans `vercel.json`
4. déplie **Environment Variables** et colle les 9 lignes ci-dessous
5. **Deploy**

### Les 9 variables

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://jhdwyiknkoqdxflafwmx.supabase.co` |
| `SUPABASE_ANON_KEY` | la clé **anon / public** — voir ci-dessous |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé **service_role** — voir ci-dessous |
| `PUBLIC_SITE_URL` | `https://dontbreakmyearth.com` |
| `RATE_LIMIT_SECRET` | le premier secret que Claude t’a donné |
| `UPLOAD_TOKEN_SECRET` | le second secret que Claude t’a donné |
| `MAX_UPLOAD_BYTES` | `8388608` |
| `SIGNED_URL_TTL_SECONDS` | `3600` |
| `GOOGLE_EARTH_URL` | `https://earth.google.com/web/` |

**Où trouver les deux clés :** Supabase → **Project Settings** (la roue
dentée) → **API Keys**.

- `SUPABASE_ANON_KEY` = la clé **anon / public** (ou `publishable`)
- `SUPABASE_SERVICE_ROLE_KEY` = la clé **service_role**, bouton *Reveal*

> ⚠️ La clé `service_role` ouvre toute la base. Elle ne va **que** dans Vercel.
> Jamais dans le code, jamais sur GitHub, jamais dans un message.

Quand c’est déployé, Vercel affiche une URL en `.vercel.app`.
**Donne-la moi** : je vérifie le site, le dépôt d’une capture et le tableau
de bord.

---

## 4 · Ton compte administrateur

Le compte avec lequel tu valideras les captures.

1. Supabase → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email : `kara.garnier27@gmail.com`
4. Password : choisis-en un, note-le
5. coche **Auto Confirm User**
6. **Create user**

Le rôle administrateur t’est donné automatiquement : ton adresse est déjà
autorisée dans la base.

---

## Ensuite

- le site public : l’URL `.vercel.app` donnée par Vercel
- ton tableau de bord : la même URL suivie de **`/admin`**

Pour le domaine `dontbreakmyearth.com` : Vercel → projet → **Settings** →
**Domains** → ajouter le domaine, puis suivre les instructions DNS chez ton
registrar.

---

## Vérifier que tout marche

1. ouvre le site, clique **ajouter votre morceau de Terre**
2. dépose une capture, remplis latitude et longitude, envoie
3. le message doit dire « reçue — elle attend d’être validée »
4. **elle ne doit apparaître nulle part sur le site** — c’est voulu
5. va sur `/admin`, connecte-toi : la capture est là
6. clique **valider**
7. recharge le site : elle a rejoint l’archive

Si l’envoi échoue, c’est presque toujours une variable mal collée.
Vercel → **Settings** → **Environment Variables**, corrige, puis **Redeploy**.
