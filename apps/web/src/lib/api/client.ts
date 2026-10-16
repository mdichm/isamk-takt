import { ApiError } from './errors';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Effectue une requête fetch vers l'API backend avec gestion centralisée des erreurs.
 * Lance une ApiError en cas de statut HTTP >= 400.
 */
export async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const url = input.startsWith('http') ? input : `${API_BASE}${input}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

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
