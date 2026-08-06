import type { VercelRequest, VercelResponse } from './_lib/vercel.js';
import { publicConfig } from './_lib/env.js';
import { handleError, json, method, noStore } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  try {
    method(req, ['GET']);
    noStore(res);
    json(res, 200, publicConfig());
  } catch (error) {
    handleError(res, error);
  }
}
