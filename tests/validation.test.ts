import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contentSchema,
  extensionFor,
  nullableText,
  submissionCreateSchema
} from '../api/_lib/validation.js';
import { matchesImageSignature } from '../api/_lib/media.js';

test('valide une proposition image complète', () => {
  const parsed = submissionCreateSchema.parse({
    filename: 'ma-terre.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2_048,
    latitude: 48.8566,
    longitude: 2.3522,
    formStartedAt: Date.now() - 2_000,
    website: ''
  });
  assert.equal(parsed.mimeType, 'image/jpeg');
  assert.equal(extensionFor(parsed.mimeType), 'jpg');
});

test('refuse les coordonnées et formats hors limites', () => {
  assert.throws(() => submissionCreateSchema.parse({
    filename: 'payload.svg',
    mimeType: 'image/svg+xml',
    sizeBytes: 10_000_000,
    latitude: 120,
    longitude: 250,
    formStartedAt: Date.now()
  }));
});

test('normalise les textes vides', () => {
  assert.equal(nullableText('   '), null);
  assert.equal(nullableText('  Terre  '), 'Terre');
});

test('valide une entrée CMS maintenable', () => {
  const parsed = contentSchema.parse({
    key: 'section.manifeste',
    type: 'section',
    title: 'Manifeste',
    value: 'La Terre ne pose pas.',
    sortOrder: 20,
    isPublished: true,
    metadata: {}
  });
  assert.equal(parsed.key, 'section.manifeste');
});

test('vérifie la signature binaire réelle des images', () => {
  assert.equal(matchesImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg'), true);
  assert.equal(matchesImageSignature(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c]), 'image/jpeg'), false);
  assert.equal(matchesImageSignature(Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]), 'image/png'), true);
});
