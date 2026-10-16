import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@takt/db';

export interface ImmutabilityOptions {
  /** Nom du paramètre de route portant l'ID de la version (défaut 'id'). */
  versionIdParam?: string;
  /** Champs du corps de requête permettant de déduire la version (ex. 'versionId'). */
  bodyVersionField?: string;
}

/**
 * Garde d'immutabilité, indépendant du rôle (s'applique même à l'Administrateur).
 *
 * Une version PUBLIEE ou ARCHIVEE (ou une année CLOTUREE) ne peut plus être
 * modifiée. Les triggers SQL renforcent cette règle en base (ST §2.4, §5.2).
 *
 * Métadonnée : `@Immutability()` sur une route. Sans métadonnée, le garde passe.
 */
@Injectable()
export class ImmutabilityGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<ImmutabilityOptions>(
      'immutability',
      [context.getHandler(), context.getClass()],
    );
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: RoleCode } | undefined;
    const role = user?.role;

    // L'immutabilité s'applique à tout le monde, y compris l'Administrateur.
    // Ce garde ne fait que déclarer l'intention ; la vérification effective de
    // l'état de la version se fait dans le service métier (lecture de la version
    // puis contrôle de son statut). Le garde lève une erreur si la route est
    // verrouillée par un paramètre `locked` explicite.
    if (request.query.locked === 'true' || request.body.locked === true) {
      throw new ForbiddenException(
        'Cette version est verrouillée et ne peut plus être modifiée',
      );
    }

    return true;
  }
}
