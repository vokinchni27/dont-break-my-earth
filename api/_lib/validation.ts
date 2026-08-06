import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
] as const;

export const submissionCreateSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(8_388_608),
  width: z.number().int().positive().max(20_000).nullable().optional(),
  height: z.number().int().positive().max(20_000).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationLabel: z.string().trim().max(120).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional(),
  authorName: z.string().trim().max(80).nullable().optional(),
  formStartedAt: z.number().int().positive(),
  website: z.string().max(0).optional().default('')
});

export const submissionCompleteSchema = z.object({
  submissionId: z.string().uuid(),
  uploadToken: z.string().min(32).max(128)
});

export const moderationSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationLabel: z.string().trim().max(120).nullable().optional(),
  comment: z.string().trim().max(1000).nullable().optional()
});

export const contentSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9][a-z0-9._-]{1,79}$/),
  type: z.enum(['intro', 'paragraph', 'quote', 'section', 'fragment']),
  title: z.string().trim().max(160).nullable().optional(),
  value: z.string().trim().min(1).max(12_000),
  sortOrder: z.number().int().min(-10_000).max(10_000).default(0),
  isPublished: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const contentUpdateSchema = contentSchema.partial().extend({
  id: z.string().uuid()
});

export function extensionFor(mime: typeof ALLOWED_MIME_TYPES[number]): string {
  return ({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif'
  } as const)[mime];
}

export function nullableText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
