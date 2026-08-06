import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

for (const htmlFile of ['index.html', 'moderation.html']) {
  const html = readFileSync(htmlFile, 'utf8');
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((ref) => ref && !/^(?:https?:|#|mailto:)/.test(ref));

  for (const ref of refs) {
    const localPath = join(dirname(htmlFile), ref.split(/[?#]/)[0]);
    if (!existsSync(localPath)) throw new Error(`${htmlFile}: ressource absente ${ref}`);
  }

  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) {
    throw new Error(`${htmlFile}: script inline incompatible avec la CSP`);
  }
}

JSON.parse(readFileSync('vercel.json', 'utf8'));
JSON.parse(readFileSync('package.json', 'utf8'));
