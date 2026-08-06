/**
 * L'erreur que le client a le droit de lire.
 *
 * Vit à part pour que `env.ts` puisse la lever sans dépendre de
 * `http.ts`, qui lui-même lit l'environnement : sans cette
 * séparation, les deux modules s'importeraient en rond.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'request_error'
  ) {
    super(message);
  }
}
