// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Garde de séparation des tâches (L0-40, EX-ROL-06)
// Vérifie que l'utilisateur authentifié n'est pas le soumetteur de l'objet
// qu'il tente de valider. Renvoie 403 SEGREGATION_OF_DUTIES en cas de conflit.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SEGREGATION_OF_DUTIES_KEY } from '../decorators/segregation-of-duties.decorator.js';

/**
 * Garde de séparation des tâches.
 *
 * Empêche un utilisateur de valider un objet qu'il a lui-même soumis.
 * Le décorateur @SegregationOfDuties() indique le champ de la requête (body ou param)
 * contenant l'identifiant du soumetteur à comparer avec l'utilisateur courant.
 *
 * @example
 *   @SegregationOfDuties('submittedBy')
 *   @Patch('versions/:id/validate')
 */
@Injectable()
export class SegregationOfDutiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const submittedByField = this.reflector.get<string | null>(
      SEGREGATION_OF_DUTIES_KEY,
      context.getHandler(),
    );

    if (!submittedByField) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: string; role?: string } | undefined;

    if (!user || !user.id) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // L'identifiant du soumetteur peut venir du body ou des params
    const submittedBy =
      request.body?.[submittedByField] ??
      request.params?.[submittedByField] ??
      request.query?.[submittedByField];

    if (submittedBy && submittedBy === user.id) {
      throw new ForbiddenException({
        detail: 'Séparation des tâches : vous ne pouvez pas valider un objet que vous avez soumis.',
        errorCode: 'SEGREGATION_OF_DUTIES',
      });
    }

    return true;
  }
}
