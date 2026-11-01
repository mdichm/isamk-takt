/**
 * Utilitaires d'authentification côté client (frontend).
 * Le token d'accès est stocké dans un cookie `token` (httpOnly en production).
 * Le fallback utilise localStorage pour les environnements de développement.
 * Le payload du JWT contient le champ `role` (signé par le backend).
 */

const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

/** Rôle utilisateur tel que porté par le JWT du backend. */
export type UserRole =
  | 'ADMINISTRATEUR'
  | 'GESTIONNAIRE'
  | 'RESPONSABLE_DEPARTEMENT'
  | 'DIRECTION'
  | 'ENSEIGNANT'
  | 'ETUDIANT';

/** Extrait le token d'accès depuis le cookie `token` ou localStorage. */
export function getTokenFromCookie(): string | undefined {
  // Tout d'abord essayer le cookie
  if (typeof document !== 'undefined') {
    const cookieToken = document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1];
    if (cookieToken) return cookieToken;
  }
  // Fallback sur localStorage (développement CORS)
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? undefined;
  }
  return undefined;
}

/** Sauvegarde le token dans localStorage (fallback pour CORS). */
export function setTokenInStorage(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }
}

/**
 * Persiste le jeton d'accès à la fois dans le cookie `token` (lu par le
 * client via `getTokenFromCookie`) et dans localStorage.
 * Le cookie est réécrit côté client car l'endpoint de refresh ne renvoie le
 * nouveau jeton que dans le corps JSON.
 */
export function persistAccessToken(token: string): void {
  setTokenInStorage(token);
  if (typeof document !== 'undefined') {
    const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `token=${token}; path=/; max-age=900; SameSite=Lax${secure}`;
  }
}

/** Supprime le jeton d'accès du cookie `token` et de localStorage. */
export function clearAccessToken(): void {
  removeTokenFromStorage();
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  }
}

/** Supprime le token de localStorage. */
export function removeTokenFromStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

/**
 * Décode le payload (second segment) d'un JWT sans vérification de signature.
 * Retourne null si le token est malformed.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payloadBase64 = parts[1];
    // Base64URL -> Base64 (ajoute le padding, remplace - par + et _ par /)
    let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const decoded = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Récupère le rôle de l'utilisateur connecté depuis le JWT.
 * Retourne undefined si aucun token n'est présent ou s'il est invalide.
 */
export function getCurrentUserRole(): UserRole | undefined {
  const token = getTokenFromCookie();
  if (!token) {
    return undefined;
  }
  const payload = decodeJwtPayload<{ role?: string }>(token);
  return (payload?.role ?? undefined) as UserRole | undefined;
}

/** Vérifie si le rôle donné correspond à l'Administrateur. */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMINISTRATEUR';
}
