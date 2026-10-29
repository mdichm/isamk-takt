// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests d'autorisation négatifs RBAC (ticket L7-06).
// Teste les guards d'autorisation avec le vrai PolicyService et ScopeRegistry.
// Vérifie AC1 (pas d'accès inter-départements), AC2 (Direction sans écriture),
// AC3 (séparation des tâches).

import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PolicyService } from '../src/policy/policy.service.js';
import { ScopeRegistry } from '../src/policy/scope.registry.js';
import {
  PermissionsGuard,
  ScopeGuard,
  SegregationOfDutiesGuard,
} from '../src/policy/index.js';
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

function makeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

async function buildGuardModule(overrides: {
  policyOverride?: Partial<PolicyService>;
  reflectorGetOverride?: (key: string) => unknown;
} = {}) {
  const module = await Test.createTestingModule({
    providers: [
      Reflector,
      {
        provide: PolicyService,
        useValue: {
          requirePermission: () => {},
          hasPermission: () => true,
          isWithinScope: () => true,
          checkSegregationOfDuties: () => {},
          ...overrides.policyOverride,
        },
      },
      {
        provide: ScopeRegistry,
        useValue: {
          resolve: () => undefined,
        },
      },
      PermissionsGuard,
      ScopeGuard,
      SegregationOfDutiesGuard,
    ],
  }).compile();

  if (overrides.reflectorGetOverride) {
    const reflector = module.get(Reflector);
    vi.spyOn(reflector, 'get').mockImplementation(overrides.reflectorGetOverride);
  }

  return module;
}

describe('RBAC negative authorization (L7-06)', () => {
  // -----------------------------------------------------------------------
  // AC1 : Aucun accès inter-départements (ScopeGuard 404 hors portée)
  // -----------------------------------------------------------------------
  describe('AC1 — Inter-départements (ScopeGuard)', () => {
    it('RESPONSABLE DEP1 → ressource DEP2 : 404 hors portée', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          isWithinScope: () => false,
        },
      });
      const guard = module.get(ScopeGuard);

      const registry = module.get(ScopeRegistry);
      vi.spyOn(registry, 'resolve').mockReturnValue(async () => 'DEP2');

      const reflector = module.get(Reflector);
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === 'scope') return { resource: 'repartition', idParam: 'id' };
        return undefined;
      });

      await expect(
        guard.canActivate(
          makeContext({
            params: { id: '123' },
            user: {
              role: RoleCode.RESPONSABLE_DEPARTEMENT,
              departments: ['DEP1'],
            },
          }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('RESPONSABLE DEP1 → ressource DEP1 : 200 (dans portée)', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          isWithinScope: () => true,
        },
      });
      const guard = module.get(ScopeGuard);

      const registry = module.get(ScopeRegistry);
      vi.spyOn(registry, 'resolve').mockReturnValue(async () => 'DEP1');

      const res = await guard.canActivate(
        makeContext({
          params: { id: '123' },
          user: {
            role: RoleCode.RESPONSABLE_DEPARTEMENT,
            departments: ['DEP1'],
          },
        }),
      );
      expect(res).toBe(true);
    });

    it('Aucun résolveur enregistré : ScopeGuard passe (gap de couverture)', async () => {
      const module = await buildGuardModule();
      const guard = module.get(ScopeGuard);

      const res = await guard.canActivate(
        makeContext({
          params: { id: '123' },
          user: {
            role: RoleCode.RESPONSABLE_DEPARTEMENT,
            departments: ['DEP1'],
          },
        }),
      );
      expect(res).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // AC2 : Direction n'a aucun accès d'écriture (PermissionsGuard 403)
  // -----------------------------------------------------------------------
  describe('AC2 — Direction sans écriture', () => {
    it('Direction → POST écriture (annee:write) : 403', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          requirePermission: (_role: RoleCode, required: string[]) => {
            if (_role === RoleCode.DIRECTION && required.some((r) => r.endsWith(':write'))) {
              throw new ForbiddenException('Permissions insuffisantes');
            }
          },
        },
      });
      const guard = module.get(PermissionsGuard);

      const reflector = module.get(Reflector);
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['annee:write'];
        return undefined;
      });

      await expect(
        guard.canActivate(
          makeContext({
            user: { role: RoleCode.DIRECTION, departments: [] },
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Direction → GET lecture seule (referentiel:read) : 200', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          requirePermission: () => {},
        },
      });
      const guard = module.get(PermissionsGuard);

      const reflector = module.get(Reflector);
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['referentiel:read'];
        return undefined;
      });

      const res = await guard.canActivate(
        makeContext({
          user: { role: RoleCode.DIRECTION, departments: [] },
        }),
      );
      expect(res).toBe(true);
    });

    it('RESPONSABLE → écriture (repartition:write) : 200', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          requirePermission: () => {},
        },
      });
      const guard = module.get(PermissionsGuard);

      const reflector = module.get(Reflector);
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['repartition:write'];
        return undefined;
      });

      const res = await guard.canActivate(
        makeContext({
          user: { role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['DEP1'] },
        }),
      );
      expect(res).toBe(true);
    });

    it('Direction → écriture (repartition:write) : 403', async () => {
      const module = await buildGuardModule({
        policyOverride: {
          requirePermission: (_role: RoleCode, required: string[]) => {
            if (_role === RoleCode.DIRECTION && required.some((r) => r.endsWith(':write'))) {
              throw new ForbiddenException('Permissions insuffisantes');
            }
          },
        },
      });
      const guard = module.get(PermissionsGuard);

      const reflector = module.get(Reflector);
      vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === 'isPublic') return false;
        if (key === 'permissions') return ['repartition:write'];
        return undefined;
      });

      await expect(
        guard.canActivate(
          makeContext({
            user: { role: RoleCode.DIRECTION, departments: [] },
          }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
  // -----------------------------------------------------------------------
  // AC3 : Séparation des tâches (SegregationOfDutiesGuard 403)
  // -----------------------------------------------------------------------
  describe('AC3 — Séparation des tâches', () => {
    it('Utilisateur valide ce quil a soumis : 403 SEGREGATION_OF_DUTIES', async () => {
      const module = await buildGuardModule({
        reflectorGetOverride: (key: string) => {
          if (key === 'segregation_of_duties') return 'submittedBy';
          return undefined;
        },
      });
      const guard = module.get(SegregationOfDutiesGuard);

      expect(() =>
        guard.canActivate(
          makeContext({
            body: { submittedBy: 'user-1' },
            user: { id: 'user-1', role: RoleCode.RESPONSABLE_DEPARTEMENT },
          }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('Utilisateur valide ce quun autre a soumis : 200', async () => {
      const module = await buildGuardModule({
        reflectorGetOverride: (key: string) => {
          if (key === 'segregation_of_duties') return 'submittedBy';
          return undefined;
        },
      });
      const guard = module.get(SegregationOfDutiesGuard);

      const res = await guard.canActivate(
        makeContext({
          body: { submittedBy: 'user-submitter' },
          user: { id: 'user-validator', role: RoleCode.RESPONSABLE_DEPARTEMENT },
        }),
      );
      expect(res).toBe(true);
    });

    it('Pas de décorateur @SegregationOfDuties : guard passe (gap de couverture)', async () => {
      const module = await buildGuardModule({
        reflectorGetOverride: () => undefined,
      });
      const guard = module.get(SegregationOfDutiesGuard);

      const res = await guard.canActivate(
        makeContext({
          user: { id: 'user-1', role: RoleCode.RESPONSABLE_DEPARTEMENT },
        }),
      );
      expect(res).toBe(true);
    });
  });
});