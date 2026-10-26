/**
 * Erreur retournée par l'API backend avec code HTTP et message lisible.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Code métier renvoyé par le backend (ex. CONFIRMATION_PUBLICATION_REQUISE). */
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Extrait un message d'erreur lisible en français depuis une ApiError.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erreur inattendue';
}

/** Extrait le code métier d'une erreur ApiError, s'il est présent. */
export function getErrorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}
