import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface ImmutabilityOptions {
  versionIdParam?: string;
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

    // Ce garde déclare l'intention d'immutabilité ; la vérification effective de
    // l'état de la version se fait dans le service métier (lecture de la version
    // puis contrôle de son statut). Il lève une erreur si la route est verrouillée
    // par un paramètre `locked` explicite.
    if (request.query.locked === 'true' || request.body.locked === true) {
      throw new ForbiddenException(
        'Cette version est verrouillée et ne peut plus être modifiée',
      );
    }

    return true;
  }
}

