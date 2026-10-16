import { Test } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MfaService } from './mfa.service.js';
import * as otplib from 'otplib';

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  securityEvent: {
    create: ReturnType<typeof vi.fn>;
  };
};

function buildPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  } as unknown as PrismaMock;
}

function buildModule(prismaMock: PrismaMock) {
  return {
    module: Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }),
    prismaMock,
  };
}

describe('MfaService', () => {
  const userId = 'user-123';
  const email = 'alice@example.fr';
  // Secret base32 d'au moins 26 caractères (≥ 16 bytes = 128 bits requis par otplib v13)
  const secret = otplib.generateSecret({ length: 32 });

  it('enroll : génère un secret et une URI otpauth://, enregistre le secret', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      email,
      mfaSecret: null,
      mfaActive: false,
    });
    prismaMock.user.update.mockResolvedValue({} as any);

    const { module, prismaMock: pm } = buildModule(prismaMock);
    const service = (await module.compile()).get(MfaService);

    const result = await service.enroll(userId);

    expect(result.secret).toHaveLength(32);
    expect(result.qrCodeUri).toBe(
      `otpauth://totp/TAKT:${encodeURIComponent(email)}?secret=${result.secret}&issuer=TAKT`,
    );
    expect(pm.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { mfaSecret: result.secret },
    });
  });

  it('enroll : 400 si MFA déjà activé', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      email,
      mfaSecret: secret,
      mfaActive: true,
    });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(MfaService);

    await expect(service.enroll(userId)).rejects.toThrow(BadRequestException);
  });

  it('verify : code valide active le MFA et écrit MFA_ENABLE', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      email,
      mfaSecret: secret,
      mfaActive: false,
    });
    prismaMock.user.update.mockResolvedValue({} as any);
    prismaMock.securityEvent.create.mockResolvedValue({} as any);

    const { module, prismaMock: pm } = buildModule(prismaMock);
    const service = (await module.compile()).get(MfaService);

    // Génère un code TOTP valide pour ce secret
    const token = otplib.generateSync({ secret });

    const result = await service.verify(userId, token);

    expect(result.success).toBe(true);
    expect(result.mfaActive).toBe(true);
    expect(pm.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { mfaActive: true },
    });
    expect(pm.securityEvent.create).toHaveBeenCalledWith({
      data: { type: 'MFA_ENABLE', userId, details: { email } },
    });
  });

  it('verify : code invalide → 401', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      email,
      mfaSecret: secret,
      mfaActive: false,
    });

    const { module } = buildModule(prismaMock);
    const service = (await module.compile()).get(MfaService);
    // Force l'échec de vérification pour éviter tout code valide par hasard
    vi.spyOn(service, 'verifyCode').mockResolvedValue(false);

    await expect(service.verify(userId, '000000')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('disable : réinitialise le MFA et écrit MFA_DISABLE', async () => {
    const prismaMock = buildPrismaMock();
    prismaMock.user.findUnique.mockResolvedValue({
      id: userId,
      mfaActive: true,
    });
    prismaMock.user.update.mockResolvedValue({} as any);
    prismaMock.securityEvent.create.mockResolvedValue({} as any);

    const { module, prismaMock: pm } = buildModule(prismaMock);
    const service = (await module.compile()).get(MfaService);

    const result = await service.disable(userId);

    expect(result.success).toBe(true);
    expect(result.mfaActive).toBe(false);
    expect(pm.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { mfaSecret: null, mfaActive: false },
    });
    expect(pm.securityEvent.create).toHaveBeenCalledWith({
      data: { type: 'MFA_DISABLE', userId },
    });
  });
});