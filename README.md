# EARTH — bac a sable de composition

Un moteur de composition generative. Les images satellites sont la matiere,
le fond blanc est le silence, l'interface disparait.

Ce n'est pas une oeuvre finie : c'est l'atelier ou l'oeuvre se decide.

---

## 1. Voir les images

```bash
node tools/index-images.mjs
```

Puis ouvre `index.html` (double-clic suffit — aucun serveur requis).

Ou, en une seule fois : **double-clic sur `tools/OUVRIR.cmd`** (indexe puis ouvre).

## 2. Enrichir l'archive

Depose des fichiers n'importe ou dans `images/`, dans le sous-dossier que tu
veux, aussi profond que tu veux :

```
images/
  ISLANDE/
    001.jpg
  ILE/
    REUNION/
      001.jpg
```

Puis relance l'indexation. Deux facons :

- ponctuelle : `node tools/index-images.mjs`
- continue : **double-clic sur `tools/VEILLE.cmd`** — laisse la fenetre ouverte,
  chaque fichier depose est indexe tout seul, il ne reste qu'a faire F5.

Formats reconnus : `jpg jpeg png webp avif gif` et `mp4 webm mov` (les videos
sont jouees en boucle, muettes ; `CONFIG.archive.includeVideos` les coupe).

Le code n'a jamais besoin d'etre modifie. Aucun nom de fichier, aucun nom de
lieu n'est ecrit en dur nulle part.

## 3. Le bac a sable

Touche **P**. Le panneau est ferme par defaut, et le reste : c'est l'atelier,
pas la piece.

| touche | effet |
|---|---|
| `espace` | composition suivante |
| `←` `→` | precedente / suivante |
| `R` | meme partition, autre tirage |
| `Maj+R` | rejouer la composition a l'identique |
| `X` | pause / reprise |
| `1` … `0` | jouer une partition precise |
| `C` | recadrage on / off (voir l'interface Google Earth) |
| `G` | noir et blanc |
| `F` | plein ecran |
| `P` | panneau |

Le bouton **copier les reglages** met tout `CONFIG` dans le presse-papier :
quand un reglage te plait, colle-le dans `js/config.js` pour le figer.

Chaque composition porte une **graine** (affichee dans le panneau). Note-la :
`CONFIG.bacASable.graine = 769033905` rejoue exactement la meme image.

---

## Architecture

Sept modules, sept responsabilites. On remplace l'un sans toucher aux autres.

| fichier | responsabilite |
|---|---|
| `js/config.js` | **le tableau de bord.** Toutes les valeurs reglables, aucune ailleurs |
| `js/utils.js` | hasard reproductible (graine), petites aides |
| `js/loader.js` | l'archive : lit le manifeste, distribue les images |
| `js/layouts.js` | **les partitions.** Ou, quelle taille, quel ordre de superposition |
| `js/motion.js` | comment une image arrive et s'en va |
| `js/stage.js` | pose et retire les plans dans le DOM, applique le recadrage |
| `js/director.js` | le temps : quoi, quand, et comment on enchaine |
| `js/panel.js` | le bac a sable (panneau + clavier) |
| `js/main.js` | amorcage. Une trentaine de lignes, et ca doit le rester |

Le flux, une fois pour toutes :

```
director  --demande une partition-->  layouts   (des positions pures)
director  --demande des images---->   loader    (l'archive)
director  --confie la pose-------->   stage  -->  motion
```

`layouts.js` ne connait ni le DOM, ni les images, ni le temps : il ne rend que
des nombres. C'est ce qui rend l'experimentation rapide et sans risque.

### Ecrire une partition

Une composition = une fonction qui rend une liste de places.

```js
EARTH.Layouts.ajouter('ma_partition', {
  label: 'ce que ca fait',
  nb: r => r.i(3, 6),                       // combien d'images
  mouvement: { entree: 'fondu', sortie: 'chute' },
  build: ({ r, nb, taille, marge }) => {
    const places = [];
    for (let i = 0; i < nb; i++) {
      places.push({
        x: r.f(marge, 1 - marge),   // centre du plan, fraction d'ecran
        y: r.f(marge, 1 - marge),
        w: taille(0.1, 0.4)         // reperes 0..1 sur CONFIG.echelle
      });
    }
    return places;
  }
});
```

Ajoute `'ma_partition'` dans `CONFIG.compositions.actives`, et elle entre dans
la rotation. Elle apparait aussi toute seule dans le panneau.

`taille(a, b)` pioche entre deux reperes de l'echelle globale : deplacer
`CONFIG.echelle.min/max` deplace toutes les partitions d'un coup, sans en
retoucher une seule.

### Ecrire un mouvement

```js
EARTH.Motion.entrees.mon_mouvement = (plan, o) => ([
  { opacity: 0, transform: 'translateY(40px)' },
  { opacity: o.opacite, transform: 'none' }
]);
```

Son nom devient disponible dans le panneau et dans `CONFIG.mouvement.entree`.

---

## Le recadrage

Les captures portent l'interface de Google Earth : bandeau bleu, menus, barre
d'attribution, mini-carte, boutons de zoom. Elle est coupee **a l'affichage**
(`CONFIG.crop`, en fractions de la hauteur), jamais sur le disque. Les fichiers
d'origine restent intacts.

Valeurs de depart, calees sur les captures actuelles (2493x1231) :
`top 0.145` / `bottom 0.11`. Touche **C** pour comparer avec/sans, curseurs du
panneau pour ajuster au pixel.

Si un jour tu captures sans l'interface, mets tout a `0`.

---

## Detail technique assume

Scripts classiques (`window.EARTH`) plutot que modules ES : les modules ES sont
bloques en `file://`, ce qui obligerait a lancer un serveur pour voir la moindre
image. Ici le double-clic suffit. Meme raison pour le double manifeste :
`manifest.json` quand la page est servie en http, `manifest.js` en repli.

## Etat de l'archive au 01/08

112 fichiers, 7 lieux : AFRIQUE (27), CHINE (33), EUROPE (32), ILE (2) +
ILE/BAHMAS (4) + ILE/REUNION (1), RUSSIE (13), dont 2 videos.

`AMERIQUE`, `AMERIQUE DU SUD` et `ASIE` sont vides : elles n'apparaissent donc
nulle part. Elles entreront d'elles-memes des qu'un fichier y sera depose.

## Ce que ce n'est pas encore

Pas de webcam, pas d'ASCII, pas de texte, pas de dons, pas de son. La base est
posee ; ces couches viendront quand la composition sera decidee.

L'ancien prototype dort dans `_v1/` — rien n'en est utilise.
