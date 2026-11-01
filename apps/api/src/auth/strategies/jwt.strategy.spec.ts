// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de la stratégie JWT (validité de session).

import { describe, it, expect, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { RoleCode } from '@takt/db';
import { JwtStrategy } from './jwt.strategy.js';

// Isolation de la mécanique Passport : seule la méthode `validate` est testée.
vi.mock('@nestjs/passport', () => ({
  PassportStrategy: () => class MockPassportStrategy {},
}));

const userId = 'user-123';
const familyId = 'family-1';

const activeUser = {
  id: userId,
  email: 'alice@example.fr',
  firstName: 'Alice',
  lastName: 'Dupont',
  isActive: true,
  roles: [{ role: RoleCode.ADMINISTRATEUR, departementCode: 'INFO' }],
};

const payload = {
  sub: userId,
  email: 'alice@example.fr',
  role: RoleCode.ADMINISTRATEUR,
  roles: [{ role: RoleCode.ADMINISTRATEUR, departementCode: 'INFO' }],
  departments: ['INFO'],
  familyId,
};

function buildStrategy(options: { activeToken?: unknown; user?: unknown } = {}) {
  const prisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue(
        'user' in options ? options.user : activeUser,
      ),
    },
    refreshToken: {
      findFirst: vi.fn().mockResolvedValue(
        'activeToken' in options ? options.activeToken : { id: 'rt-active' },
      ),
    },
  };
  const configService = { get: vi.fn().mockReturnValue('secret') };
  const strategy = new JwtStrategy(configService as never, prisma as never);
  return { strategy, prisma };
}

describe('JwtStrategy.validate', () => {
  it('retourne le profil quand la session est valide', async () => {
    const { strategy } = buildStrategy();
    const result = await strategy.validate(payload);
    expect(result.id).toBe(userId);
    expect(result.email).toBe('alice@example.fr');
    expect(result.role).toBe(RoleCode.ADMINISTRATEUR);
    expect(result.departments).toEqual(['INFO']);
  });

  it('lève 401 si l’utilisateur est introuvable', async () => {
    const { strategy } = buildStrategy({ user: null });
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('lève 401 si l’utilisateur est inactif', async () => {
    const { strategy } = buildStrategy({ user: { ...activeUser, isActive: false } });
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('conserve la session après une rotation (un jeton actif subsiste dans la famille)', async () => {
    // Rotation normale : l'ancien jeton est révoqué, le nouveau est actif
    // dans la même famille. La session ne doit PAS êtreinvalidée.
    const { strategy, prisma } = buildStrategy({ activeToken: { id: 'rt-new' } });
    await expect(strategy.validate(payload)).resolves.toBeDefined();
    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        familyId,
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
    });
  });

  it('lève 401 « Session révoquée » quand la famille n’a plus aucun jeton actif', async () => {
    // Réutilisation d’un jeton révoqué, déconnexion ou réinitialisation de
    // mot de passe : toute la famille est révoquée.
    const { strategy } = buildStrategy({ activeToken: null });
    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate(payload)).rejects.toThrow('Session révoquée');
  });

  it('ne vérifie pas les refresh tokens pour un jeton sans familyId', async () => {
    const { strategy, prisma } = buildStrategy({ activeToken: null });
    const { familyId: _familyId, ...payloadWithoutFamily } = payload;
    await expect(strategy.validate(payloadWithoutFamily)).resolves.toBeDefined();
    expect(prisma.refreshToken.findFirst).not.toHaveBeenCalled();
  });
});
