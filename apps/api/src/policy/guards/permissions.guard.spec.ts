import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard.js';
import { PolicyService } from '../policy.service.js';
import { RoleCode } from '@takt/db';

vi.mock('@takt/db', () => ({
  RoleCode: {
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    GESTIONNAIRE: 'GESTIONNAIRE',
    RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
    DIRECTION: 'DIRECTION',
    ENSEIGNANT: 'ENSEIGNANT',
    ETUDIANT: 'ETUDIANT',
  },
}));

function makeFixture({
  isPublic = false,
  required = undefined,
  user = undefined,
}: {
  isPublic?: boolean;
  required?: string[] | undefined;
  user?: Record<string, unknown> | undefined;
} = {}) {
  const reflector = {
    getAllAndOverride: (_key: string) => {
      if (_key === 'isPublic') return isPublic;
      return required;
    },
  } as any;
  const policy = {
    requirePermission: (_role: RoleCode, _required: string[]) => {
      if (!user) throw new ForbiddenException('Utilisateur non authentifie');
      const role = _role as RoleCode;
      if (_required.includes('user:manage') && role !== RoleCode.ADMINISTRATEUR) {
        throw new ForbiddenException('Permissions insuffisantes');
      }
    },
  } as unknown as PolicyService;
  const request = { user };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
  return { guard: new PermissionsGuard(reflector, policy), context };
}

describe('PermissionsGuard (defaut = refus)', () => {
  it('refuse toute route sans decorateur @Permissions', async () => {
    const { guard, context } = makeFixture({ isPublic: false, required: undefined });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('le @Public court-circuite le refus par defaut', async () => {
    const { guard, context } = makeFixture({ isPublic: true, required: undefined });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('accorde quand l utilisateur a au moins une permission requise', async () => {
    const { guard, context } = makeFixture({
      isPublic: false,
      required: ['user:manage'],
      user: { role: RoleCode.ADMINISTRATEUR },
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('refuse quand l utilisateur n a aucune permission requise', async () => {
    const { guard, context } = makeFixture({
      isPublic: false,
      required: ['user:manage'],
      user: { role: RoleCode.DIRECTION },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('refuse quand il n y a pas d utilisateur', async () => {
    const { guard, context } = makeFixture({
      isPublic: false,
      required: ['referentiel:read'],
      user: undefined,
    });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

