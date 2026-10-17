// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Garde d'accès réservé aux administrateurs (L0-37)
// Vérifie que l'utilisateur authentifié possède le rôle ADMINISTRATEUR.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RoleCode } from '@takt/db';

/**
 * Garde restreignant l'accès aux seules requêtes émises par un administrateur.
 * S'applique après l'authentification (JwtAuthGuard).
 *
 * Refuse avec 403 si l'utilisateur n'est pas authentifié ou n'a pas le rôle
 * RoleCode.ADMINISTRATEUR.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;

    if (!user || user.role !== RoleCode.ADMINISTRATEUR) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}
