import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';
import { PolicyService } from '../policy.service.js';
import { RoleCode } from '@takt/db';

/**
 * Garde d'autorisation RBAC.
 *
 * Règles :
 * - Les routes `@Public()` passent (auth, santé, métriques).
 * - Toute autre route sans décorateur `@Permissions` → refus 403 (défaut = refus,
 *   ST §5.2).
 * - Sinon, l'utilisateur doit posséder au moins l'une des permissions requises.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policy: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Défaut = refus : toute route sans décorateur de permission est rejetée.
    if (!required || required.length === 0) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      role?: RoleCode;
      roles?: { role: RoleCode; departementCode?: string }[];
      departments?: string[];
    } | undefined;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    const role = user.role ?? user.roles?.[0]?.role;
    if (!role) {
      throw new ForbiddenException('Permissions insuffisantes');
    }

    this.policy.requirePermission(role, required);
    return true;
  }
}

