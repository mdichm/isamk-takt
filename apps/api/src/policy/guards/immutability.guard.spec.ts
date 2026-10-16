import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { ImmutabilityGuard } from './immutability.guard.js';

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
  lockedQuery = false,
  lockedBody = false,
  hasMetadata = false,
}: {
  lockedQuery?: boolean;
  lockedBody?: boolean;
  hasMetadata?: boolean;
} = {}) {
  const reflector = {
    getAllAndOverride: () => (hasMetadata ? { versionIdParam: 'id' } : undefined),
  } as any;
  const request = {
    query: lockedQuery ? { locked: 'true' } : {},
    body: lockedBody ? { locked: true } : {},
  } as any;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
  return { guard: new ImmutabilityGuard(reflector), context };
}

describe('ImmutabilityGuard (s applique meme a l Administrateur)', () => {
  it('passe quand il n y a pas de metadonnee @Immutability', () => {
    const { guard, context } = makeContext({ hasMetadata: false });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('passe quand la version n est pas verrouillee', () => {
    const { guard, context } = makeContext({ hasMetadata: true });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('refuse quand la version est verrouillee (query)', () => {
    const { guard, context } = makeContext({ hasMetadata: true, lockedQuery: true });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('refuse quand la version est verrouillee (body)', () => {
    const { guard, context } = makeContext({ hasMetadata: true, lockedBody: true });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

