import { ApiError } from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Gestionnaire optionnel invoqué lorsqu'une requête reçoit un 401.
 * Permet au provider d'authentification de tenter un refresh transparent du jeton.
 */
let onUnauthorized: (() => Promise<boolean>) | undefined;

/**
 * Enregistre le gestionnaire de 401 (appelé par AuthProvider au montage).
 */
export function registerUnauthorizedHandler(handler: () => Promise<boolean>): void {
  onUnauthorized = handler;
}

/**
 * Effectue une requête fetch vers l'API backend avec gestion centralisée des erreurs.
 * Lance une ApiError en cas de statut HTTP >= 400.
 *
 * En cas de 401, invoque le gestionnaire de refresh s'il est enregistré, puis
 * relance la requête une fois avec le nouveau token.
 */
export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const url = input.startsWith('http') ? input : `${API_BASE}${input}`;

  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (init?.headers) {
    for (const [key, value] of Object.entries(init.headers as Record<string, string>)) {
      headers[key] = value;
    }
  }

  const token = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1]
    : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // Refresh transparent en cas de token expiré (401).
  if (response.status === 401 && onUnauthorized) {
    await onUnauthorized();

    // Reconstruire les headers avec le nouveau token.
    const newHeaders: Record<string, string> = { ...headers };
    const newToken = typeof document !== 'undefined'
      ? document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1]
      : undefined;
    if (newToken) {
      newHeaders.Authorization = `Bearer ${newToken}`;
    }

    const retried = await fetch(url, {
      ...init,
      headers: newHeaders,
    });
    return retried;
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = await response.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch {
      detail = response.statusText;
    }
    throw new ApiError(response.status, detail ?? 'Erreur API');
  }

  return response;
}

export { API_BASE };
