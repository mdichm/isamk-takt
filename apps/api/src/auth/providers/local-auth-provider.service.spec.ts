import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LocalAuthProvider } from './local-auth-provider.service.js';
import { hashPassword } from '../password.js';

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

function buildPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaMock;
}

async function buildProvider(prismaMock: PrismaMock) {
  return (await Test.createTestingModule({
    providers: [
      LocalAuthProvider,
      { provide: PrismaService, useValue: prismaMock },
    ],
  }).compile()).get(LocalAuthProvider);
}

describe('LocalAuthProvider (L0-14)', () => {
  const email = 'alice@example.fr';
  const password = 'MonSuperMotDePasse12!';

  let realHash: string;

  beforeAll(async () => {
    realHash = await hashPassword(password);
  });

  function buildBaseUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 'user-123',
      email,
      passwordHash: realHash,
      firstName: 'Alice',
      lastName: 'Dupont',
      isActive: true,
      failedAttempts: 0,
      lockedUntil: null,
      mfaActive: false,
      mfaSecret: null,
      roles: [{ role: 'ETUDIANT' }],
      ...overrides,
    };
  }

  it('authentifie un utilisateur avec le bon mot de passe', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue(buildBaseUser());

    const provider = await buildProvider(prismaMock);

    const result = await provider.authenticate({ email, password });
    expect(result.email).toBe(email);
    expect(result.passwordHash).toBe(realHash);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email },
      include: { roles: true },
    });
  });

  it('rejette un mauvais mot de passe (coût argon2 payé)', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue(buildBaseUser());

    const provider = await buildProvider(prismaMock);

    await expect(
      provider.authenticate({ email, password: 'MauvaisMotDePasse12!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejette un compte inconnu en payant le coût argon2 (anti-énumération)', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue(null);

    const provider = await buildProvider(prismaMock);

    await expect(provider.authenticate({ email, password })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejette un compte sans hash de mot de passe (fournisseur externe)', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue(
      buildBaseUser({ passwordHash: null }),
    );

    const provider = await buildProvider(prismaMock);

    await expect(provider.authenticate({ email, password })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
