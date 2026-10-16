/**
 * Utilitaires d'authentification côté client (frontend).
 * Le token d'accès est stocké dans un cookie httpOnly `token`.
 * Le payload du JWT contient le champ `role` (signé par le backend).
 */

/** Rôle utilisateur tel que porté par le JWT du backend. */
export type UserRole =
  | 'ADMINISTRATEUR'
  | 'GESTIONNAIRE'
  | 'RESPONSABLE_DEPARTEMENT'
  | 'DIRECTION'
  | 'ENSEIGNANT'
  | 'ETUDIANT';

/** Extrait le token d'accès depuis le cookie `token`. */
export function getTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1];
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
