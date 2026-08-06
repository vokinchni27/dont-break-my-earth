import type { IncomingMessage, ServerResponse } from 'node:http';

/** Contrat minimal des fonctions Node Vercel, gardé localement afin de ne pas
 * embarquer le kit de build Vercel comme simple dépendance de types. */
export type VercelRequest = IncomingMessage & {
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
};

export type VercelResponse = ServerResponse & {
  status(statusCode: number): VercelResponse;
  json(jsonBody: unknown): VercelResponse;
};
