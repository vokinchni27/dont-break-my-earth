# EARTH — archive vivante

Un systeme qui compose en permanence de nouvelles relations entre des images
satellites, leurs coordonnees, du texte et celui qui regarde.

Ce n'est pas une galerie. Ce n'est pas un site avec des images. C'est un moteur
dont les images sont la matiere premiere, et dont le visiteur est un rouage.

Le site ne doit jamais donner l'impression d'etre termine.

---

## 1. Ouvrir

```bash
node tools/index-images.mjs
```

Puis ouvrir `index.html` — le double-clic suffit, aucun serveur requis.
Ou, en une fois : **double-clic sur `tools/OUVRIR.cmd`**.

## 2. Enrichir l'archive

Deposer des fichiers n'importe ou dans `images/`, dans le sous-dossier voulu,
aussi profond que voulu. Puis reindexer :

- ponctuel : `node tools/index-images.mjs`
- continu : **`tools/VEILLE.cmd`** — laisser la fenetre ouverte, chaque fichier
  depose est indexe tout seul ; il ne reste qu'a rafraichir (F5).

Formats : `jpg jpeg png webp avif gif` et `mp4 webm mov`. Les videos sont jouees
en boucle et muettes, et **sur-representees dans le tirage** (`archive.poidsVideos`)
pour qu'elles ne se perdent pas dans une archive d'images.

Aucun nom de fichier, aucun nom de lieu n'est ecrit en dur nulle part.

## 3. Relever les coordonnees

Les captures portent leurs coordonnees en bas a droite. Pour qu'elles deviennent
une **donnee calculable** (voisinage reel, partition `latitude`, lignes de
composition), il faut les transcrire une fois :

```bash
python tools/coord-sheets.py       # planches de contact des bandeaux
```

Cela produit `tools/_coords/sheet-*.png` : des bandes empilees et agrandies, une
par capture manquante, numerotees. On les lit, on remplit `images/coordinates.json` :

```json
{
  "ISLANDE/001.jpg": {
    "lat": "64°08'12.34\"N", "lon": "21°56'01.02\"W",
    "camera": "12 896 m", "sol": "110 m", "echelle": "1 000 m"
  }
}
```

Puis on reindexe : l'indexeur convertit le DMS en degres decimaux tout seul.

**Etat actuel : 110 captures sur 112 sont situees**, de -31° a +75° de latitude.
Les deux non situees sont les videos.

---

## 4. Ce que le visiteur peut faire

Le clic est le mot le plus pauvre du vocabulaire. Les autres sont la duree, la
vitesse et l'immobilite.

| geste | ce qui arrive |
|---|---|
| **effleurer** une image | ses coordonnees apparaissent ; sa latitude et sa longitude se tracent en travers de l'ecran, a leur vraie place dans l'archive ; le vrai bandeau Google Earth s'agrandit en bas |
| **s'y attarder** (1 s) | l'image en appelle trois autres — **ses voisines reelles sur la Terre**, pas ses voisines de dossier |
| **appui bref** | plein regard : tout le reste s'efface, elle occupe l'ecran quelques secondes, puis rend l'espace et disparait |
| **appui maintenu** | on **creuse** : chaque palier fait surgir un fragment du meme lieu, plus petit et plus serre, et **de plus en plus zoome dans l'image**. Creuser peu referme le trou ; creuser profond garde ce qu'on a trouve |
| **deplacement lent** | les images respirent — parallaxe par profondeur, les grandes bougent plus |
| **deplacement vif** | elles se dispersent, puis reviennent toujours |
| **ne rien faire** (7 s) | la contemplation est payee : tout s'efface, une image immense apparait et derive tres lentement |
| **cliquer le vide** | le blanc n'est pas mort : une image y nait |
| **deposer un fichier** | contribuer (voir plus bas) |

Le temps s'arrete quand le visiteur agit : tant qu'il fait quelque chose, la
machine ne remplace pas ce qu'il regarde (`rythme.patience`).

### Le clavier

`espace` composition suivante · `← →` precedente / suivante · `R` autre tirage ·
`Maj+R` rejouer a l'identique · `Entree` tout aligner sur la grille ·
`Retour arriere` tout effacer · `1-9` partition · `X` pause · `G` grille ·
`H` appareillage · `N` noir et blanc · `C` recadrage · `T` texte · `A` ajouter
une capture · `E` provoquer un evenement rare · `W` webcam · `P` panneau ·
`F` plein ecran

### Les evenements rares

Ils ne tombent pas du ciel : ils naissent d'un geste. Avoir creuse profond
appelle plutot une `apparition`, avoir tout disperse appelle plutot un `eclat`.

`inondation` (toutes les coordonnees de l'archive envahissent l'ecran, chacune a
sa vraie place — la carte se montre, une fois) · `effacement` · `nuit` ·
`alignement` (l'ordre, brutalement) · `eclat` (la grille explose) · `apparition` ·
`combustion` (une image se consume par surexposition — pas de flammes) ·
`envahissement` (le texte remplit la page).

Regles : `evenements.rarete` et `evenements.palier` (delai minimum entre deux).

---

## 5. L'archive collective

Le visiteur va sur Google Earth, trouve un endroit, capture, et depose le fichier
sur la page. Trois choses se passent, dans cet ordre :

1. **l'image entre immediatement dans la composition** — il voit sa Terre vivre
   avec les autres avant meme que le reseau ait repondu ;
2. le fichier part vers Supabase, en silence ;
3. il **attend d'etre retenu**. Personne ne se publie soi-meme.

Si l'archive collective est injoignable, l'image reste quand meme dans la
composition. Le geste n'est jamais perdu.

### Mise en service (une seule fois)

1. Ouvrir Supabase → projet **gabY SCRYPTS** → SQL Editor → New query
2. Coller **tout** `supabase/earth.sql` → Run
3. C'est tout. Le site se connecte deja (`CONFIG.collectif`).

Le SQL cree la table `earth_contributions`, le bucket `earth`, et les regles :

- n'importe qui peut **proposer**, mais seulement en statut « en attente » ;
- le public ne **lit** que ce qui a ete retenu ;
- toi seule vois ce qui attend, et toi seule decides.

Ce qui protege l'archive, ce sont ces regles — pas le secret de la cle publique,
qui est faite pour vivre dans la page.

### Moderer

Ouvrir **`moderation.html`**. Connexion par lien magique, sans mot de passe
(l'adresse autorisee est `collectif.moderatrice`).

Chaque proposition s'affiche avec **sa bande de donnees agrandie** : les
coordonnees se lisent directement, sans ouvrir le fichier. On remplit lieu /
latitude / longitude, puis **retenir** ou **ecarter**. Une capture retenue
rejoint l'archive de tous les visiteurs a leur prochain chargement — sans
toucher au code.

---

## 6. Architecture

Un module, une responsabilite. On en remplace un sans toucher aux autres.

| fichier | responsabilite |
|---|---|
| `js/config.js` | **le tableau de bord.** Toutes les valeurs reglables, aucune ailleurs |
| `js/utils.js` | hasard reproductible (graine), bus d'evenements, conversion DMS |
| `js/supabase.js` | client REST ecrit a la main — pas de SDK, pas de build |
| `js/loader.js` | l'archive : manifeste, tirage pondere, **voisinage geographique** |
| `js/grid.js` | la grille visible, et les cellules qu'elle offre aux partitions |
| `js/layouts.js` | **les partitions.** Ou, quelle taille, quel ordre de superposition |
| `js/motion.js` | comment une image arrive et s'en va |
| `js/coords.js` | les donnees devenues typographie |
| `js/text.js` | le texte vivant — les lettres fuient le curseur et reviennent |
| `js/stage.js` | pose, recadre, deplace et retire les plans |
| `js/events.js` | les evenements rares |
| `js/director.js` | le temps : quoi, quand, comment on enchaine |
| `js/gestures.js` | **le vocabulaire du geste** — traduit la main en verbes |
| `js/interactions.js` | ce que les gestes provoquent. Le coeur de l'oeuvre |
| `js/webcam.js` | le visiteur en mosaique de paysages |
| `js/contribute.js` | le depot des captures |
| `js/hud.js` | l'appareillage : angles, horloge, bandeau defilant, curseur |
| `js/panel.js` | le bac a sable (panneau + clavier) |
| `js/main.js` | amorcage. Une cinquantaine de lignes, et ca doit le rester |

Le flux :

```
gestures  --emet des verbes-->  interactions  --agit sur-->  stage
director  --demande-->  layouts (des nombres purs) + loader (l'archive)
                                        |
                                     grid (des cellules, si on veut bien)
```

`layouts.js` ne connait ni le DOM, ni le temps. `gestures.js` ne connait aucune
image. `stage.js` ne decide rien.

### Ecrire une partition

```js
EARTH.Layouts.ajouter('ma_partition', {
  label: 'ce que ca fait',
  nb: r => r.i(3, 6),
  grille: 'parfois',                        // 'toujours' | 'jamais' | 'parfois'
  mouvement: { entree: 'fondu', sortie: 'chute' },
  build: ({ r, nb, taille, marge, grille }) => ([
    { x: r.f(marge, 1 - marge), y: r.f(marge, 1 - marge), w: taille(0.1, 0.4) }
  ])
});
```

Ajouter le nom dans `CONFIG.compositions.actives` : elle entre dans la rotation
et apparait toute seule dans le panneau.

Une partition peut aussi **choisir ses images** (`items:`) : c'est ce qui permet
a `latitude` d'etre gouvernee par les coordonnees plutot que par le hasard.

### Ecrire un mouvement, un evenement

```js
EARTH.Motion.entrees.mon_mouvement = (plan, o) => ([
  { opacity: 0, transform: 'translateY(40px)' },
  { opacity: o.opacite, transform: 'none' }
]);

EARTH.Evenements.registre.mon_evenement = fin => { /* ... */ setTimeout(fin, 3000); };
```

---

## 7. Le bac a sable

Touche **P**. Ferme par defaut, et le reste : c'est l'atelier, pas la piece.
Reglages en direct de l'echelle, du rythme, du mouvement, du recadrage, de la
grille, du geste, des donnees, du texte, des evenements et de l'archive.

Le bouton **copier les reglages** met tout `CONFIG` dans le presse-papier : quand
un reglage plait, on le colle dans `js/config.js` pour le figer.

Chaque composition porte une **graine** (affichee dans le panneau).
`CONFIG.bacASable.graine = 769033905` rejoue exactement la meme image.

---

## 8. Le recadrage

L'interface de Google Earth (bandeau bleu, menus, barre d'attribution, mini-carte)
est coupee **a l'affichage** — jamais sur le disque. `CONFIG.crop`, en fractions
de hauteur. Valeurs calees sur les captures 2493×1231 : `top 0.145` / `bottom 0.11`.
Touche **C** pour comparer avec / sans.

Le bandeau de donnees, lui, est rappele **en vrais pixels** au survol : on ne
recompose pas le texte, on va chercher l'image.

---

## 9. La webcam

Jamais de video brute. La camera n'est qu'une source de luminance, reduite a une
grille de cellules ; chaque cellule assez claire devient un fragment de paysage.
Le visage n'est pas montre, il est **reconstitue en Terre**.

Touche **W**. Desactivee par defaut. Deux sources (`CONFIG.webcam.source`) :

- `camera` — la vraie camera. Exige **https ou localhost** (pas `file://`).
- `test` — une mire animee : permet de verifier toute la chaine sans camera et
  sans autorisation.

---

## 10. Le telephone

Tout fonctionne au doigt : souris, doigt et stylet passent par le meme chemin
(Pointer Events). Sur mobile la grille se resserre (6×10), le panneau devient une
feuille basse, le curseur en croix disparait, la pastille « ajouter une capture »
se centre avec une cible tactile confortable, et la page ne defile jamais.

Le glisser-deposer n'existe pas au doigt : la pastille ouvre le selecteur de
fichiers.

---

## Detail technique assume

Scripts classiques (`window.EARTH`) plutot que modules ES : les modules ES sont
bloques en `file://`, ce qui obligerait a lancer un serveur pour voir la moindre
image. Ici le double-clic suffit. Meme raison pour le double manifeste
(`manifest.json` en http, `manifest.js` en repli) et pour le client Supabase
ecrit a la main.

L'appareillage est en fusion `difference` : il se lit noir sur le blanc et blanc
sur les images sombres, sans jamais poser de fond. Attention — la fusion doit
etre portee par la **couche**, pas par ses enfants : un element qui cree un
contexte d'empilement confine le melange a lui-meme, et le texte disparait.

## Ce qui n'est pas encore la

Le son. Les dons. Un vrai chemin de partage d'une composition (la graine le
permettrait deja). L'ancien prototype dort dans `_v1/` — rien n'en est utilise.
