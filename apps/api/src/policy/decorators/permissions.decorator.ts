import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const SCOPE_KEY = 'scope';

export interface ScopeOptions {
  /** Nom de la ressource (ex. 'user', 'seance', 'version'). */
  resource: string;
  /** Nom du paramètre de route portant l'identifiant de l'objet (défaut 'id'). */
  idParam?: string;
  /** Nom du paramètre de requête/corps portant le département cible (optionnel). */
  departmentParam?: string;
}

/**
 * Déclare les permissions `ressource:action` requises pour accéder à une route.
 * Toute route sans ce décorateur est refusée par le `PermissionsGuard` (défaut = refus).
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Déclare que la route est soumise à une vérification de portée (département).
 * Le `ScopeGuard` compare le département de l'objet cible avec ceux de l'utilisateur.
 * Hors portée → 404 (pour ne rien révéler des autres départements).
 */
export type Permission = string;
export const Scope = (options: ScopeOptions) => SetMetadata(SCOPE_KEY, options);
