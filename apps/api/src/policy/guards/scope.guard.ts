import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY, ScopeOptions } from '../decorators/permissions.decorator.js';
import { PolicyService } from '../policy.service.js';
import { ScopeRegistry } from '../scope.registry.js';
import { RoleCode } from '@takt/db';

/**
 * Garde de portée (département).
 *
 * Quand une route est décorée de `@Scope(...)`, le garde résout le département de
 * l'objet cible et le compare avec les départements de l'utilisateur connecté.
 * - Hors portée → 404 (ST §5.2 : on ne révèle pas l'existence d'objets hors portée).
 * - Pas de métadonnée @Scope ou pas de résolveur enregistré → le garde passe
 *   (le service métier gère déjà le 404 le cas échéant).
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policy: PolicyService,
    private registry: ScopeRegistry,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope = this.reflector.getAllAndOverride<ScopeOptions>(
      SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!scope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      role?: RoleCode;
      roles?: { role: RoleCode; departementCode?: string }[];
      departments?: string[];
    } | undefined;
    if (!user) {
      return true; // l'auth est gérée par JwtAuthGuard / PermissionsGuard
    }

    const role = user.role ?? user.roles?.[0]?.role;
    if (!role) {
      return true;
    }

    const idParam = scope.idParam ?? 'id';
    const id = request.params?.[idParam] ?? request.query?.[idParam] ?? request.body?.[idParam];
    if (!id) {
      return true;
    }

    const resolver = this.registry.resolve(scope.resource);
    if (!resolver) {
      // Aucun résolveur enregistré pour cette ressource : le garde passe.
      return true;
    }

    const userDepartments =
      user.departments ??
      (user.roles?.map((r) => r.departementCode).filter(Boolean) as string[]) ??
      undefined;

    const targetDepartment = await resolver(id, userDepartments);
    if (!this.policy.isWithinScope(role, userDepartments, targetDepartment)) {
      throw new NotFoundException('Objet introuvable');
    }

    return true;
  }
}
