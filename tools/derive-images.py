# ============================================================
# EARTH — tools/derive-images.py
# ------------------------------------------------------------
# Trois etats pour chaque capture, jamais un seul :
#
#   apercu   640 px   les vignettes, la poussiere, les nuees
#   moyen   1400 px   la lecture courante
#   origine    —      le fichier tel qu'il est sorti de l'ecran,
#                     jamais reencode, pour le survol et le clic
#
# Le site choisit tout seul selon la taille affichee et la
# densite de l'ecran. Les derivees vivent dans images/_cache/
# (ignore par git, regenerable a tout moment) et le prefixe _
# les tient hors de l'archive indexee.
#
#     python tools/derive-images.py
#     python tools/derive-images.py --force
# ============================================================

import json
import sys
from pathlib import Path
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
IMAGES = RACINE / "images"
CACHE = IMAGES / "_cache"

TAILLES = [640, 1400]
QUALITE = {640: 80, 1400: 90}
EXT = {".jpg", ".jpeg", ".png", ".webp"}


def sources():
    for p in sorted(IMAGES.rglob("*")):
        if not p.is_file() or p.suffix.lower() not in EXT:
            continue
        rel = p.relative_to(IMAGES).as_posix()
        if rel.startswith("_"):
            continue
        yield rel, p


def main():
    force = "--force" in sys.argv
    derivees = {}
    faites = passees = 0

    for rel, src in sources():
        im = None
        dispo = []
        for t in TAILLES:
            cible = CACHE / str(t) / (Path(rel).with_suffix(".jpg").as_posix())
            cible.parent.mkdir(parents=True, exist_ok=True)

            if cible.exists() and not force and cible.stat().st_mtime >= src.stat().st_mtime:
                dispo.append(t)
                passees += 1
                continue

            if im is None:
                im = Image.open(src).convert("RGB")

            if im.width <= t:
                # deja plus petite que la derivee : inutile de la fabriquer
                continue

            copie = im.copy()
            copie.thumbnail((t, t * 4), Image.LANCZOS)
            copie.save(cible, "JPEG", quality=QUALITE[t], optimize=True, progressive=True)
            dispo.append(t)
            faites += 1

        if dispo:
            derivees[rel] = sorted(dispo)

    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / "derivees.json").write_text(
        json.dumps(derivees, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    poids = sum(f.stat().st_size for f in CACHE.rglob("*.jpg"))
    print(f"{faites} derivee(s) fabriquee(s), {passees} deja a jour")
    print(f"{len(derivees)} capture(s) declinees — cache : {poids/1048576:.1f} Mo")
    print("relance ensuite : node tools/index-images.mjs")


if __name__ == "__main__":
    main()
