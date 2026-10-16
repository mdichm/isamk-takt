import { describe, it, expect } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ScopeGuard } from './scope.guard.js';
import { PolicyService } from '../policy.service.js';
import { ScopeRegistry } from '../scope.registry.js';
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

function makeContext({
  scope = undefined,
  user = undefined,
  params = {},
  query = {},
  body = {},
  resolver = undefined,
}: {
  scope?: Record<string, unknown> | undefined;
  user?: Record<string, unknown> | undefined;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  resolver?: ((id: string) => Promise<string | undefined | null>) | undefined;
} = {}) {
  const reflector = { getAllAndOverride: () => scope } as any;
  const policy = {
    isWithinScope: () => true,
  } as unknown as PolicyService;
  const registry = {
    resolve: () => resolver,
  } as unknown as ScopeRegistry;
  const request = { params, query, body, user };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
  return { guard: new ScopeGuard(reflector, policy, registry), context };
}

describe('ScopeGuard (portee departement)', () => {
  it('passe quand il n y a pas de metadonnee @Scope', async () => {
    const { guard, context } = makeContext({ scope: undefined });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('passe quand aucun resolveur n est enregistre pour la ressource', async () => {
    const { guard, context } = makeContext({
      scope: { resource: 'user', idParam: 'id' },
      user: { role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['DEP1'] },
      params: { id: 'u1' },
    });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('passe quand l objet est dans le departement de l utilisateur', async () => {
    const { guard, context } = makeContext({
      scope: { resource: 'user', idParam: 'id' },
      user: { role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['DEP1'] },
      params: { id: 'u1' },
      resolver: async () => 'DEP1',
    });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('renvoie 404 quand l objet est hors portee', async () => {
    const reflector = { getAllAndOverride: () => ({ resource: 'user', idParam: 'id' }) } as any;
    const policy = { isWithinScope: () => false } as unknown as PolicyService;
    const registry = {
      resolve: () => async () => 'DEP2',
    } as unknown as ScopeRegistry;
    const request = {
      params: { id: 'u1' },
      query: {},
      body: {},
      user: { role: RoleCode.RESPONSABLE_DEPARTEMENT, departments: ['DEP1'] },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    const guard = new ScopeGuard(reflector, policy, registry);
    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});

