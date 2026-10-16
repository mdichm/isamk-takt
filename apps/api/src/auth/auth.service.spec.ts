import { Test } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { hashPassword, verifyPassword } from './password.js';
import type { RoleCode } from '@takt/db';
// ---------------------------------------------------------------------------
// Doublon PrismaService minimal (mocks des méthodes utilisées par AuthService)
// ---------------------------------------------------------------------------
type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  refreshToken: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  parametreSecurite: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

function buildPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    parametreSecurite: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaMock;
}

function buildModule(prismaMock: PrismaMock) {
  const jwtService = {
    sign: vi.fn((payload: any) => `token-${payload.sub}`),
  };

  return {
    module: Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtService },
      ],
    }),
    jwtService,
  };
}

describe('password (argon2id)', () => {
  it('hache puis vérifie un mot de passe', async () => {
    const hash = await hashPassword('MonSuperMotDePasse12!');
    expect(hash).not.toBe('MonSuperMotDePasse12!');
    expect(await verifyPassword('MonSuperMotDePasse12!', hash)).toBe(true);
    expect(await verifyPassword('MauvaisMotDePasse12!', hash)).toBe(false);
  });
});

describe('AuthService', () => {
  const email = 'alice@example.fr';
  const password = 'MonSuperMotDePasse12!';
  const userId = 'user-123';
  const familyId = 'family-1';

  const baseUser = {
    id: userId,
    email,
    passwordHash: 'hash-argon2',
    firstName: 'Alice',
    lastName: 'Dupont',
    isActive: true,
    roles: [{ role: 'ADMINISTRATEUR' as RoleCode }],
  };

  it('register : crée l\'utilisateur avec un hash argon2id et retourne les tokens', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.parametreSecurite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1', familyId });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    const result = await service.register({
      email,
      password,
      firstName: 'Alice',
      lastName: 'Dupont',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email,
          passwordHash: expect.any(String),
          firstName: 'Alice',
          lastName: 'Dupont',
        }),
      }),
    );
    expect(result.accessToken).toBe(`token-${userId}`);
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe(email);
  });

  it('register : refuse un mot de passe trop court (paramètres de sécurité)', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.parametreSecurite.findUnique.mockResolvedValue({ longueurMin: 16 } as any);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await expect(
      service.register({
        email,
        password: 'tropcourt',
        firstName: 'Alice',
        lastName: 'Dupont',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('register : 409 si email déjà utilisé', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.parametreSecurite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: userId, email });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await expect(
      service.register({
        email,
        password,
        firstName: 'Alice',
        lastName: 'Dupont',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login : succès avec argon2id, message générique en cas d\'échec', async () => {
    const prismaMock = buildPrismaMock();
    const hash = await hashPassword(password);
    prismaMock.parametreSecurite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash: hash });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1', familyId });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    const result = await service.login({ email, password });
    expect(result.accessToken).toBe(`token-${userId}`);
    expect(result.refreshToken).toBeDefined();

    await expect(service.login({ email, password: 'FauxMotDePasse12!' })).rejects.toThrow(
      'Identifiants invalides',
    );
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'inconnu@example.fr', password })).rejects.toThrow(
      'Identifiants invalides',
    );
  });

  it('login : 401 compte désactivé', async () => {
    const prismaMock = buildPrismaMock();
    const hash = await hashPassword(password);
    prismaMock.parametreSecurite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: hash,
      isActive: false,
    });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await expect(service.login({ email, password })).rejects.toThrow('Compte désactivé');
  });

  it('refreshToken : rotation conserve la même famille', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId,
      familyId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-2', familyId });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    const result = await service.refreshToken('refresh-token-1');
    expect(result.accessToken).toBe(`token-${userId}`);
    expect(result.refreshToken).toBeDefined();
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ familyId }),
      }),
    );
    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('refreshToken : réutilisation d\'un jeton révoqué révoque toute la famille', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId,
      familyId,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await expect(service.refreshToken('refresh-token-1')).rejects.toThrow(
      'Token de rafraîchissement invalide ou expiré',
    );
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('refreshToken : 401 si jeton inconnu ou expiré', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.refreshToken.findUnique.mockResolvedValue(null);

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await expect(service.refreshToken('inconnu')).rejects.toThrow(
      'Token de rafraîchissement invalide ou expiré',
    );

    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId,
      familyId,
      revokedAt: null,
      expiresAt: new Date(0),
    } as any);
    await expect(service.refreshToken('refresh-token-1')).rejects.toThrow(
      'Token de rafraîchissement invalide ou expiré',
    );
  });

  it('logout : révoque le jeton présenté', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(AuthService);

    await service.logout(userId, 'refresh-token-1');
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId, tokenHash: 'refresh-token-1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
  });
