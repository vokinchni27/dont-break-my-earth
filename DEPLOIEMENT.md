# Le site en ligne

**https://dont-break-my-earth.vercel.app**

C'est l'adresse à partager, telle quelle. Elle est **publique** : personne n'a
besoin d'un compte Vercel, et aucun nom de domaine n'est nécessaire.

> Attention à ne pas partager une adresse de *déploiement* — la longue, avec
> une suite de caractères au milieu, que le tableau de bord Vercel propose au
> clic. Celle-là est protégée par une connexion. Mets la courte en favori.

| | où | état |
|---|---|---|
| Base de données | Supabase `ircojzlpirqtawaieofo` | en place |
| Code | GitHub `vokinchni27/dont-break-my-earth` | en place |
| Hébergement | Vercel, déploiement à chaque `push` | en place |
| Variables | les 5 obligatoires | en place |
| Compte administrateur | Supabase → Authentication | à créer |

---

## Envoyer une mise à jour

```bash
cd "C:/Users/karac/Desktop/EARTH VIEW"; git push origin HEAD:main
```

Le déploiement prend une trentaine de secondes. Pour savoir quel code tourne
vraiment, `/api/config` affiche le début du commit déployé — c'est le moyen le
plus sûr de distinguer « le correctif ne marche pas » de « le correctif n'est
pas encore là ».

Si tu ne vois pas un changement, c'est presque toujours ton navigateur qui te
sert l'ancien fichier : **Ctrl + Maj + R**.

---

## Ton compte administrateur

Le compte avec lequel tu valides les captures. À créer une fois.

1. https://supabase.com/dashboard/project/ircojzlpirqtawaieofo/auth/users
2. **Add user** → **Create new user**
3. Email : `kara.garnier27@gmail.com`
4. Mot de passe : choisis-en un, note-le
5. coche **Auto Confirm User**
6. **Create user**

Le rôle administrateur est donné automatiquement : ton adresse est déjà
autorisée dans la base.

Ton tableau de bord : **https://dont-break-my-earth.vercel.app/admin**

---

## Les variables Vercel

Elles sont posées. Pour mémoire, si un jour il faut les reposer :

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://ircojzlpirqtawaieofo.supabase.co` |
| `SUPABASE_ANON_KEY` | la clé **anon / publishable** |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé **service_role**, bouton *Reveal* |
| `RATE_LIMIT_SECRET` | 32 caractères minimum |
| `UPLOAD_TOKEN_SECRET` | 32 caractères minimum, différent du précédent |

https://supabase.com/dashboard/project/ircojzlpirqtawaieofo/settings/api-keys

> La clé `service_role` ouvre toute la base. Elle ne va **que** dans Vercel.
> Jamais dans le code, jamais sur GitHub, jamais dans un message.

Après toute modification : **Deployments** → le dernier → `···` → **Redeploy**.
Sans cela, les variables ne sont pas relues.

Un espace ou un retour à la ligne collé au copier-coller n'est plus un
problème : les valeurs sont nettoyées avant d'être jugées. Et si une variable
manque ou est refusée, `/api/config` la **nomme** dans son champ `aCorriger`.

---

## Vérifier que tout marche

1. ouvre le site, clique **ajouter votre morceau de Terre**
2. dépose une capture et envoie — **sans rien remplir d'autre** :
   seul le fichier est obligatoire
3. le message doit dire « reçue — elle attend d'être validée »
4. **elle n'apparaît nulle part sur le site** — c'est voulu
5. va sur `/admin`, connecte-toi : la capture est là
6. clique **valider**
7. recharge le site : elle a rejoint l'archive

---

## Quand le dépôt refuse

Le serveur nomme désormais l'étage qui lâche, au lieu d'un « service
momentanément indisponible » qui ne dit rien. La réponse porte un `error` et
un `indice` :

| `error` | ce qu'il faut faire |
|---|---|
| `service_unconfigured` | une variable Vercel manque — `/api/config` dit laquelle |
| `quota_unavailable` | droits SQL manquants → jouer `supabase/reparer.sql` |
| `submission_insert_failed` | la table `submissions` refuse la ligne ; l'`indice` est le code Postgres |
| `storage_unavailable` | le bucket `earth` est absent et n'a pas pu être créé |
| `rate_limited` | cinq dépôts dans l'heure depuis la même adresse : normal |

---

## Un nom de domaine, plus tard

Facultatif — le site fonctionne très bien en `.vercel.app`.

Un domaine, ça **s'achète** (~12 €/an) ; l'ajouter dans Vercel ne le crée pas.
C'est déjà arrivé : `dont-break-my-earth.com` avait été ajouté sans être
enregistré, Vercel en avait fait le domaine principal, et l'adresse
`.vercel.app` redirigeait alors vers le vide.

Le plus simple est d'acheter depuis Vercel — **Domains** → **Buy** — car il est
alors vendeur et hébergeur : aucun réglage DNS à faire. Ensuite, change
`PUBLIC_SITE_URL` dans les variables, puis redéploie.
