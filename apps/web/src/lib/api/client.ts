import { getTokenFromCookie } from '@/lib/auth';
import { ApiError } from './errors';

/**
 * Préfixe des appels API côté navigateur.
 *
 * Le web et l'API sont servis sous la même origine : le proxy Next
 * (`next.config.mjs`) en développement et nginx (`infra/nginx.conf`) en
 * production routent tous deux « /api/* » vers le backend. Les chemins
 * relatifs doivent donc passer par ce préfixe, faute de quoi ils sont
 * interprétés comme des routes du front (404 ou page HTML).
 */
const API_BASE = '/api';

/**
 * Résout l'URL effective d'un appel API.
 *
 * - URL absolue : inchangée (appel direct à l'API, CORS inclus).
 * - Chemin déjà préfixé par « /api » : inchangé (pas de double préfixe).
 * - Chemin relatif : préfixé par « /api » (ex. « /repartitions?page=1 »
 *   devient « /api/repartitions?page=1 »).
 */
function resolveApiUrl(input: string): string {
  if (input.startsWith('http')) {
    return input;
  }
  if (input === API_BASE || input.startsWith(`${API_BASE}/`)) {
    return input;
  }
  return `${API_BASE}${input.startsWith('/') ? '' : '/'}${input}`;
}

/**
 * Endpoints d'authentification pour lesquels le refresh automatique est
 * désactivé. Sans cette garde, un 401 sur /auth/refresh déclencherait à
 * nouveau le handler de 401 : boucle infinie qui bloque connexion ET
 * déconnexion.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Gestionnaire optionnel invoqué lorsqu'une requête reçoit un 401.
 * Permet au provider d'authentification de tenter un refresh transparent du jeton.
 */
let onUnauthorized: (() => Promise<boolean>) | undefined;

/** Refresh en cours, partagé par toutes les requêtes 401 concurrentes. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Enregistre le gestionnaire de 401 (appelé par AuthProvider au montage).
 */
export function registerUnauthorizedHandler(handler: () => Promise<boolean>): void {
  onUnauthorized = handler;
}

/** Indique si l'URL cible un endpoint d'authentification (refresh interdit). */
function isAuthEndpoint(url: string): boolean {
  const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
  return NO_REFRESH_PATHS.some((p) => path === p || path.endsWith(p));
}

/**
 * Déclenche un refresh unique : les requêtes 401 concurrentes partagent la
 * même promesse, ce qui évite les rotations de refresh token en cascade.
 */
async function refreshOnce(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  const handler = onUnauthorized;
  if (!handler) {
    return false;
  }
  const pending = handler().catch(() => false);
  refreshInFlight = pending;
  try {
    return await pending;
  } finally {
    if (refreshInFlight === pending) {
      refreshInFlight = null;
    }
  }
}

/** Construit une ApiError à partir d'une réponse HTTP en erreur. */
async function toApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined;
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
    };
    const rawMessage = body?.message ?? body?.error;
    if (Array.isArray(rawMessage)) {
      // Validation DTO : class-validator renvoie une liste de messages.
      detail = rawMessage.join(', ');
    } else if (typeof rawMessage === 'string') {
      detail = rawMessage;
    } else {
      detail = JSON.stringify(body);
    }
    if (typeof body?.code === 'string') {
      code = body.code;
    }
  } catch {
    detail = response.statusText;
  }
  return new ApiError(response.status, detail ?? 'Erreur API', code);
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
  const url = resolveApiUrl(input);

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

  const token = getTokenFromCookie();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // Refresh transparent en cas de token expiré (401).
  // Les endpoints d'authentification en sont exemptés pour éviter toute récursion.
  if (response.status === 401 && onUnauthorized && !isAuthEndpoint(url)) {
    const refreshed = await refreshOnce();

    if (refreshed) {
      // Reconstruire les headers avec le nouveau token.
      const newHeaders: Record<string, string> = { ...headers };
      const newToken = getTokenFromCookie();
      if (newToken) {
        newHeaders.Authorization = `Bearer ${newToken}`;
      } else {
        delete newHeaders.Authorization;
      }

      const retried = await fetch(url, {
        ...init,
        headers: newHeaders,
      });
      if (!retried.ok) {
        throw await toApiError(retried);
      }
      return retried;
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response;
}

export { API_BASE };
