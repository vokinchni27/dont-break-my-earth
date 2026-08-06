import type { VercelRequest, VercelResponse } from './_lib/vercel.js';
import { publicConfig } from './_lib/env.js';
import { handleError, json, method, noStore } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  try {
    method(req, ['GET']);
    noStore(res);
    json(res, 200, {
      ...publicConfig(),
      // Quel code tourne vraiment. Sans ce reperage, « le correctif
      // ne marche pas » et « le correctif n'est pas deploye » sont
      // impossibles a distinguer de l'exterieur — on attend devant
      // une page en se demandant laquelle des deux on regarde.
      // Vercel fournit la variable ; ce n'est pas un secret.
      version: (process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7)
    });
  } catch (error) {
    handleError(res, error);
  }
}
