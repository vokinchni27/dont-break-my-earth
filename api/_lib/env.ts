import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PUBLIC_SITE_URL: z.string().url().optional(),
  RATE_LIMIT_SECRET: z.string().min(32),
  UPLOAD_TOKEN_SECRET: z.string().min(32),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(8_388_608).default(8_388_608),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(3_600),
  GOOGLE_EARTH_URL: z.string().url().default('https://earth.google.com/web/')
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  cached ??= serverSchema.parse(process.env);
  return cached;
}

export function publicConfig(): {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  maxUploadBytes: number;
  googleEarthUrl: string;
} {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      enabled: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      maxUploadBytes: 8_388_608,
      googleEarthUrl: 'https://earth.google.com/web/'
    };
  }
  return {
    enabled: true,
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
    maxUploadBytes: parsed.data.MAX_UPLOAD_BYTES,
    googleEarthUrl: parsed.data.GOOGLE_EARTH_URL
  };
}
