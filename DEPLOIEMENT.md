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
| `PUBLIC_SITE_URL` | `https://dont-break-my-earth.vercel.app` |
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

- le site public : **https://dont-break-my-earth.vercel.app**
- ton tableau de bord : **https://dont-break-my-earth.vercel.app/admin**

---

## Rendre le site public — le réglage qui bloque tout

Par défaut, Vercel protège **toutes** les adresses `.vercel.app` par une
connexion : un visiteur tombe sur une page de login Vercel au lieu du site.
Tant que ce réglage est actif, le site est invisible pour le public, même si
le déploiement a parfaitement réussi.

**Vercel → projet `dont-break-my-earth` → Settings → Deployment Protection →
Vercel Authentication → `Disabled` → Save.**

C'est gratuit et c'est le seul geste qui rende le site accessible à tout le
monde sur `.vercel.app`. (Vérifié le 06/08 : `ssoProtection` était activé en
mode `all_except_custom_domains`.)

---

## Le domaine — à lire avant d'y retoucher

Un domaine, ça **s'achète**. L'ajouter dans Vercel ne le crée pas.

`dont-break-my-earth.com` a été ajouté au projet mais n'a jamais été
enregistré : il n'existe dans aucun DNS au monde. Vercel l'a quand même pris
comme domaine principal, donc l'adresse `.vercel.app` **redirige vers le vide**
et le site devient injoignable pour tout le monde.

### Réparer maintenant (30 secondes, gratuit)

Vercel → projet **dont-break-my-earth** → **Domains** → ligne
`dont-break-my-earth.com` → **Edit** → **Remove**.

Le `.vercel.app` cesse aussitôt de rediriger et sert le site.

### Avoir un vrai nom plus tard (~12 €/an)

Les deux orthographes sont libres à ce jour :
`dontbreakmyearth.com` et `dont-break-my-earth.com`.

Le plus simple est d'acheter depuis Vercel — **Domains** → **Buy** — car Vercel
est alors à la fois vendeur et hébergeur : aucun réglage DNS à faire, le site
bascule tout seul. Passer par un autre registrar marche aussi, mais il faut
alors créer soi-même l'enregistrement `A` vers `216.198.79.1`.

Après l'achat, change `PUBLIC_SITE_URL` dans les variables Vercel pour la
nouvelle adresse, puis **Redeploy**.

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
