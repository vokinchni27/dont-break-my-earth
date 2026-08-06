/* ============================================================
   DON’T BREAK MY EARTH — tools/lister-textes.mjs
   ------------------------------------------------------------
   Régénère TEXTES.md à partir de js/textes.js.

   La liste n’est jamais écrite à la main : elle est dérivée de
   la seule source de vérité. Si un texte manque dans le tableau,
   c’est qu’il manque dans textes.js — donc qu’il traîne encore
   en dur dans un composant.

       node tools/lister-textes.mjs
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

globalThis.window = {};
new Function(fs.readFileSync(path.join(RACINE, 'js/textes.js'), 'utf8'))();
const { T } = globalThis.window.EARTH;

const TITRES = {
  titre: 'Le seuil',
  hud: 'L’appareillage',
  contribution: 'Contribuer',
  contenu: 'Le feuillet « à propos »',
  panneau: 'Le bac à sable',
  aide: 'Les consignes de geste',
  fragments: 'Les fragments vivants',
  evenements: 'Les événements rares',
  webcam: 'La webcam',
  panne: 'Les pannes',
  admin: 'L’administration'
};

const plat = T.toutes();
const groupes = new Map();
for (const [cle, valeur] of Object.entries(plat)) {
  const g = cle.split('.')[0];
  if (!groupes.has(g)) groupes.set(g, []);
  groupes.get(g).push([cle, valeur]);
}

const cellule = (v) => {
  const t = Array.isArray(v)
    ? v.map((x) => (Array.isArray(x) ? x.join(' — ') : x)).join(' · ')
    : String(v);
  return t.replace(/\|/g, '\\|').replace(/\n/g, ' ');
};

let out = '# Tous les textes du site\n\n';
out += 'Chaque texte porte une **clé stable**. Pour réécrire le site, on ne touche\n';
out += 'que `js/textes.js` — aucune chaîne visible n’est écrite ailleurs.\n\n';
out += 'Une ligne de la table `site_content` dont la colonne `key` vaut exactement\n';
out += 'une clé ci-dessous **remplace** le texte statique au chargement, sans toucher\n';
out += 'au code ni redéployer. C’est le CMS.\n\n';
out += `> ${Object.keys(plat).length} textes. Régénérer avec \`node tools/lister-textes.mjs\`.\n\n---\n\n`;

for (const [g, lignes] of groupes) {
  out += `## ${TITRES[g] || g}\n\n| clé | texte actuel |\n|---|---|\n`;
  for (const [cle, valeur] of lignes) out += `| \`${cle}\` | ${cellule(valeur)} |\n`;
  out += '\n';
}

fs.writeFileSync(path.join(RACINE, 'TEXTES.md'), out, 'utf8');
console.log(`TEXTES.md régénéré — ${Object.keys(plat).length} textes.`);
