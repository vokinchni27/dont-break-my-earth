import { z } from 'zod';
import { HttpError } from './errors.js';

// Un copier-coller depuis un tableau de bord ramène souvent un espace
// ou un retour à la ligne invisible. On les enlève avant de juger :
// une clé juste ne doit pas être refusée pour un caractère fantôme.
const propre = () => z.string().transform((v) => v.trim());

const serverSchema = z.object({
  SUPABASE_URL: propre().pipe(z.string().url()),
  SUPABASE_ANON_KEY: propre().pipe(z.string().min(20)),
  SUPABASE_SERVICE_ROLE_KEY: propre().pipe(z.string().min(20)),
  PUBLIC_SITE_URL: propre().pipe(z.string().url()).optional(),
  RATE_LIMIT_SECRET: propre().pipe(z.string().min(32)),
  UPLOAD_TOKEN_SECRET: propre().pipe(z.string().min(32)),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(8_388_608).default(8_388_608),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(3_600),
  GOOGLE_EARTH_URL: z.string().url().default('https://earth.google.com/web/')
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/**
 * Une variable Vercel absente n'est pas une donnée utilisateur
 * invalide : c'est le service qui n'est pas configuré. Sans cette
 * distinction, le visiteur lit « Données invalides » alors qu'il
 * n'a rien fait de mal, et personne ne pense à regarder Vercel.
 */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const manquantes = parsed.error.issues
      .map((issue) => issue.path.join('.'))
      .filter((nom, index, tout) => nom && tout.indexOf(nom) === index);
    console.error('[api] configuration incomplète :', manquantes.join(', '));
    throw new HttpError(
      503,
      'Le dépôt collectif n’est pas encore configuré sur le serveur.',
      'service_unconfigured'
    );
  }
  cached = parsed.data;
  return cached;
}

/**
 * Le NOM des variables qui bloquent, et la raison — jamais leur
 * valeur, ni un extrait, ni une longueur exacte.
 *
 * Sans cela, « enabled: false » ne dit rien : les cinq variables
 * peuvent être posées et une seule être refusée, sans qu'on sache
 * laquelle. Les noms sont déjà publics (README, .env.example) ;
 * ce sont les valeurs qui sont secrètes, et elles ne sortent pas.
 */
function diagnostic(erreur: z.ZodError): string[] {
  const vues = new Set<string>();
  for (const souci of erreur.issues) {
    const nom = String(souci.path[0] ?? '?');
    if (vues.has(nom)) continue;
    vues.add(nom);
  }
  return [...vues].map((nom) => {
    const brut = process.env[nom];
    if (brut === undefined) return `${nom} : absente`;
    if (brut.trim() === '') return `${nom} : vide`;
    return `${nom} : valeur refusée (trop courte, ou ce n’est pas une URL)`;
  });
}

export function publicConfig(): {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  maxUploadBytes: number;
  googleEarthUrl: string;
  aCorriger?: string[];
} {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      enabled: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      maxUploadBytes: 8_388_608,
      googleEarthUrl: 'https://earth.google.com/web/',
      aCorriger: diagnostic(parsed.error)
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
