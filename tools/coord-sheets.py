# ============================================================
# EARTH — tools/coord-sheets.py
# ------------------------------------------------------------
# Les captures portent leurs coordonnees en bas a droite.
# Ce script decoupe cette bande pour chaque image et les empile
# en planches de contact lisibles, dans tools/_coords/.
#
# Sert a remplir images/coordinates.json : on lit les planches,
# on transcrit. Les coordonnees deviennent alors une donnee du
# projet (typographie, lignes de composition, tri par latitude)
# et plus seulement des pixels.
#
#     python tools/coord-sheets.py            (seulement les manquantes)
#     python tools/coord-sheets.py --toutes
# ============================================================

import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

RACINE = Path(__file__).resolve().parent.parent
IMAGES = RACINE / "images"
SORTIE = RACINE / "tools" / "_coords"

# la bande utile, en fractions de l'image d'origine
BANDE = (0.58, 0.962, 1.0, 1.0)     # gauche, haut, droite, bas
ZOOM = 2                             # agrandissement pour la lecture
PAR_PLANCHE = 12
MARGE_LABEL = 92

EXT = {".jpg", ".jpeg", ".png", ".webp"}


def fichiers():
    out = []
    for p in sorted(IMAGES.rglob("*")):
        if p.is_file() and p.suffix.lower() in EXT:
            out.append(p.relative_to(IMAGES).as_posix())
    return out


def deja_connues():
    f = IMAGES / "coordinates.json"
    if not f.exists():
        return {}
    return json.loads(f.read_text(encoding="utf-8"))


def bande(chemin):
    im = Image.open(IMAGES / chemin)
    w, h = im.size
    boite = (int(w * BANDE[0]), int(h * BANDE[1]), int(w * BANDE[2]), int(h * BANDE[3]))
    crop = im.crop(boite).convert("RGB")
    return crop.resize((crop.width * ZOOM, crop.height * ZOOM), Image.LANCZOS)


def main():
    toutes = "--toutes" in sys.argv
    connues = deja_connues()
    liste = [f for f in fichiers() if toutes or f not in connues]

    if not liste:
        print("toutes les coordonnees sont deja transcrites.")
        return

    SORTIE.mkdir(parents=True, exist_ok=True)
    for f in SORTIE.glob("sheet-*.png"):
        f.unlink()

    index = {}
    planche_n = 0
    for debut in range(0, len(liste), PAR_PLANCHE):
        lot = liste[debut:debut + PAR_PLANCHE]
        vignettes = [bande(c) for c in lot]
        larg = max(v.width for v in vignettes) + MARGE_LABEL
        haut = sum(v.height for v in vignettes)

        planche = Image.new("RGB", (larg, haut), "white")
        dessin = ImageDraw.Draw(planche)
        y = 0
        for i, (chemin, v) in enumerate(zip(lot, vignettes)):
            numero = debut + i + 1
            planche.paste(v, (MARGE_LABEL, y))
            dessin.text((10, y + v.height // 2 - 6), f"[{numero:03d}]", fill="black")
            dessin.line((0, y, larg, y), fill="#cccccc")
            index[str(numero)] = chemin
            y += v.height

        planche_n += 1
        chemin_planche = SORTIE / f"sheet-{planche_n:02d}.png"
        planche.save(chemin_planche)
        print(f"{chemin_planche.name} : {len(lot)} bandes")

    (SORTIE / "index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n{len(liste)} bande(s) sur {planche_n} planche(s) — index dans tools/_coords/index.json")


if __name__ == "__main__":
    main()
