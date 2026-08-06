import assert from 'node:assert/strict';
import test from 'node:test';
import { publicConfig } from '../api/_lib/env.js';

const VALIDES = {
  SUPABASE_URL: 'https://exemple.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_' + 'x'.repeat(24),
  SUPABASE_SERVICE_ROLE_KEY: 'y'.repeat(40),
  RATE_LIMIT_SECRET: 'a'.repeat(64),
  UPLOAD_TOKEN_SECRET: 'b'.repeat(64)
} as const;

function poser(valeurs: Record<string, string | undefined>): void {
  for (const [nom, valeur] of Object.entries({ ...VALIDES, ...valeurs })) {
    if (valeur === undefined) delete process.env[nom];
    else process.env[nom] = valeur;
  }
}

test('un espace ou un retour à la ligne collé au copier-coller ne bloque rien', () => {
  // C'est le piège le plus courant : la clé est bonne, mais elle
  // arrive du tableau de bord avec un caractère invisible au bout.
  poser({
    SUPABASE_URL: '  https://exemple.supabase.co\n',
    RATE_LIMIT_SECRET: 'a'.repeat(64) + '\n',
    SUPABASE_ANON_KEY: VALIDES.SUPABASE_ANON_KEY + ' '
  });
  const config = publicConfig();
  assert.equal(config.enabled, true);
  assert.equal(config.supabaseUrl, 'https://exemple.supabase.co');
  assert.equal(config.supabaseAnonKey, VALIDES.SUPABASE_ANON_KEY);
});

test('la configuration incomplète nomme les variables fautives, jamais leurs valeurs', () => {
  poser({ RATE_LIMIT_SECRET: 'trop-court', UPLOAD_TOKEN_SECRET: undefined });
  const config = publicConfig();
  assert.equal(config.enabled, false);

  const aCorriger = config.aCorriger ?? [];
  assert.equal(aCorriger.length, 2);
  assert.ok(aCorriger.some((l) => l.startsWith('RATE_LIMIT_SECRET') && l.includes('refusée')));
  assert.ok(aCorriger.some((l) => l.startsWith('UPLOAD_TOKEN_SECRET') && l.includes('absente')));

  // aucun secret ne doit fuir par le diagnostic
  const tout = aCorriger.join(' ');
  assert.ok(!tout.includes('trop-court'));
  assert.ok(!tout.includes(VALIDES.SUPABASE_SERVICE_ROLE_KEY));
});

test('une variable posée mais vide se distingue d’une variable absente', () => {
  poser({ SUPABASE_URL: '   ' });
  const aCorriger = publicConfig().aCorriger ?? [];
  assert.ok(aCorriger.some((l) => l === 'SUPABASE_URL : vide'));
});
