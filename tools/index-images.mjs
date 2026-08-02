#!/usr/bin/env node
/* ============================================================
   EARTH — tools/index-images.mjs
   ------------------------------------------------------------
   Parcourt images/ recursivement et ecrit DEUX fichiers :

     images/manifest.json   -> pour un chargement via serveur http
     images/manifest.js     -> repli global, fonctionne meme en file://

   C'est le seul lien entre le disque et le moteur.
   Ajouter des images = deposer les fichiers, relancer ce script.
   Aucune ligne de code a modifier, jamais.

     node tools/index-images.mjs
     node tools/index-images.mjs --watch     (reindexe a chaque ajout)
   ============================================================ */

import { promises as fs } from 'node:fs';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const IMAGES = path.join(ROOT, 'images');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);

/* --- parcours recursif ------------------------------------ */

async function walk(dir, base = '') {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...await walk(path.join(dir, entry.name), rel));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    const kind = IMAGE_EXT.has(ext) ? 'image' : VIDEO_EXT.has(ext) ? 'video' : null;
    if (!kind) continue;
    out.push({
      // chemin relatif a index.html, encode pour les dossiers a espaces
      src: 'images/' + rel.split('/').map(encodeURIComponent).join('/'),
      path: rel,
      place: base || 'RACINE',          // le sous-dossier = le lieu
      name: path.basename(entry.name, ext),
      type: kind
    });
  }
  return out;
}

/* --- coordonnees ------------------------------------------ */
/* images/coordinates.json est renseigne a partir des planches de
   tools/coord-sheets.py. Les chaines DMS lues sur les captures sont
   converties en degres decimaux : les coordonnees deviennent une
   matiere calculable (voisinage par latitude, lignes de composition,
   tri) et plus seulement du texte. */

async function lireCoordonnees() {
  try {
    return JSON.parse(await fs.readFile(path.join(IMAGES, 'coordinates.json'), 'utf8'));
  } catch {
    return {};
  }
}

function dmsVersDecimal(chaine) {
  if (!chaine) return null;
  const m = String(chaine).match(/(\d+)°\s*(\d+)'\s*([\d.]+)"?\s*([NSEWO])/i);
  if (!m) return null;
  const [, d, mn, s, dir] = m;
  let v = Number(d) + Number(mn) / 60 + Number(s) / 3600;
  if (/[SWO]/i.test(dir)) v = -v;
  return Math.round(v * 1e6) / 1e6;
}

/* "12 896 m" | "123 km" | "40 cm" -> metres */
function versMetres(chaine) {
  if (!chaine) return null;
  const m = String(chaine).replace(/[\s  ]/g, '').match(/^(-?[\d.]+)(km|cm|m)$/i);
  if (!m) return null;
  const v = Number(m[1]);
  const u = m[2].toLowerCase();
  return Math.round((u === 'km' ? v * 1000 : u === 'cm' ? v / 100 : v) * 100) / 100;
}

/* --- ecriture --------------------------------------------- */

async function build() {
  const items = await walk(IMAGES);
  const coords = await lireCoordonnees();

  for (const item of items) {
    const c = coords[item.path];
    if (!c) continue;
    item.coord = {
      lat: c.lat,
      lon: c.lon,
      latDec: dmsVersDecimal(c.lat),
      lonDec: dmsVersDecimal(c.lon),
      camera: c.camera,
      cameraM: versMetres(c.camera),
      sol: c.sol,
      solM: versMetres(c.sol),
      echelle: c.echelle,
      echelleM: versMetres(c.echelle)
    };
  }
  const places = [...new Set(items.map(i => i.place))].sort((a, b) => a.localeCompare(b, 'fr'));

  const situees = items.filter(i => i.coord && i.coord.latDec != null);

  const manifest = {
    generated: new Date().toISOString(),
    count: items.length,
    situees: situees.length,
    places,
    byPlace: Object.fromEntries(places.map(p => [p, items.filter(i => i.place === p).length])),
    etendue: situees.length ? {
      latMin: Math.min(...situees.map(i => i.coord.latDec)),
      latMax: Math.max(...situees.map(i => i.coord.latDec)),
      lonMin: Math.min(...situees.map(i => i.coord.lonDec)),
      lonMax: Math.max(...situees.map(i => i.coord.lonDec))
    } : null,
    items
  };

  const json = JSON.stringify(manifest, null, 2);
  await fs.writeFile(path.join(IMAGES, 'manifest.json'), json, 'utf8');
  await fs.writeFile(
    path.join(IMAGES, 'manifest.js'),
    '/* genere par tools/index-images.mjs — ne pas editer a la main */\n' +
    'window.EARTH_MANIFEST = ' + json + ';\n',
    'utf8'
  );

  const videos = items.filter(i => i.type === 'video').length;
  console.log(
    `archive indexee : ${items.length} fichier(s)` +
    (videos ? ` (dont ${videos} video(s))` : '') +
    ` — ${places.length} lieu(x) — ${situees.length} situe(s)`
  );
  const orphelines = items.filter(i => !i.coord && i.type === 'image');
  if (orphelines.length) {
    console.log(`\n${orphelines.length} image(s) sans coordonnees :`);
    console.log('   python tools/coord-sheets.py  puis completer images/coordinates.json');
  }
  for (const p of places) console.log(`   ${String(manifest.byPlace[p]).padStart(4)}  ${p}`);
  return manifest;
}

/* --- veille ----------------------------------------------- */

async function watch() {
  await build();
  console.log('\nveille active sur images/ — Ctrl+C pour arreter\n');
  let timer = null;
  fsSync.watch(IMAGES, { recursive: true }, (_event, filename) => {
    if (filename && /manifest\.(json|js)$/.test(String(filename))) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(console.error), 400);
  });
}

const args = process.argv.slice(2);
(args.includes('--watch') || args.includes('-w') ? watch() : build()).catch(err => {
  console.error(err);
  process.exit(1);
});
