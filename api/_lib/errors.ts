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
    public readonly code = 'request_error',
    /**
     * Un indice technique court pour les pannes d'INSTALLATION :
     * le code d'erreur Postgres ou Storage, rien d'autre. Jamais un
     * message brut, jamais une valeur, jamais un secret.
     *
     * Il existe parce que les journaux Vercel ne sont pas toujours
     * a portee de main : sans lui, un 503 oblige a deviner lequel
     * des trois etages a lache.
     */
    public readonly indice?: string
  ) {
    super(message);
  }
}
