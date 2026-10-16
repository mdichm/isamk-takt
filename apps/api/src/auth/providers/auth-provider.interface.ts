import { RoleCode } from '@takt/db';

/**
 * Utilisateur authentifié tel que retourné par un fournisseur d'authentification.
 * Les rôles sont fournis pour que le RBAC (géré par AuthService) reste
 * indépendant du fournisseur d'authentification (L0-14).
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string | null;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  mfaActive: boolean;
  mfaSecret: string | null;
  roles: { role: RoleCode }[];
}

/**
 * Contrat d'un fournisseur d'authentification.
 *
 * L'authentification locale passe par cette interface (L0-14). Cela permet
 * d'ajouter ultérieurement des fournisseurs SSO (OIDC, LDAP/AD) sans toucher
 * au RBAC ni au reste du flux d'authentification.
 */
export interface AuthProvider {
  readonly name: 'local' | 'oidc' | 'ldap';
  authenticate(credentials: unknown): Promise<AuthenticatedUser>;
}
