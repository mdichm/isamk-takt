import { Test } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { EmailService } from './email.service.js';
import { hashPassword } from './password.js';

type PrismaMock = {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  passwordResetToken: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  passwordHistory: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  refreshToken: { updateMany: ReturnType<typeof vi.fn> };
  securityEvent: { create: ReturnType<typeof vi.fn> };
  parametreSecurite: { findUnique: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
};

function buildPrismaMock(): PrismaMock {
  return {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordHistory: { findMany: vi.fn(), create: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
    securityEvent: { create: vi.fn() },
    parametreSecurite: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as PrismaMock;
}

function buildModule(prismaMock: PrismaMock) {
  const emailService = { sendPasswordResetLink: vi.fn().mockResolvedValue(true) };
  return {
    module: Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailService },
      ],
    }),
    emailService,
  };
}

const userId = 'user-123';
const adminId = 'admin-123';
const email = 'alice@example.fr';
const token = 'reset-token-abc123';
const baseUser = { id: userId, email, isActive: true };

describe('PasswordResetService', () => {
  describe('requestReset (déclenchement par l’Administrateur)', () => {
    it('devrait générer un token, envoyer l’e-mail et journaliser l’événement', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.user.findUnique.mockResolvedValue(baseUser);
      prismaMock.parametreSecurite.findUnique.mockResolvedValue(null);
      prismaMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.passwordResetToken.create.mockResolvedValue({ id: 'rt-1', tokenHash: token, expiresAt: new Date() });
      prismaMock.securityEvent.create.mockResolvedValue({ id: 'se-1' });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);

      const result = await service.requestReset(userId, adminId);

      expect(result.message).toContain('lien de réinitialisation');
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith({
        data: { userId, tokenHash: expect.any(String), expiresAt: expect.any(Date), demandePar: adminId },
      });
      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: { type: 'PASSWORD_RESET_REQUEST', userId, email, details: expect.objectContaining({ demandePar: adminId }) },
      });
    });

    it('devrait lever NotFoundException si l’utilisateur est introuvable', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.user.findUnique.mockResolvedValue(null);
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.requestReset(userId, adminId)).rejects.toThrow(NotFoundException);
    });

    it('devrait lever NotFoundException si l’utilisateur est inactif', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false });
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.requestReset(userId, adminId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmReset (confirmation par l’utilisateur avec le token)', () => {
    it('devrait réinitialiser le mot de passe, marquer le token utilisé et révoquer les sessions', async () => {
      const newPassword = 'NouveauSuperPass12!';

      let capturedTx: any;
      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: token, usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        user: { ...baseUser, passwordHash: 'old-hash', id: userId },
      });
      prismaMock.parametreSecurite.findUnique.mockResolvedValue({ longueurMin: 12, historique: 5 });
      prismaMock.passwordHistory.findMany.mockResolvedValue([]);
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          user: { update: vi.fn().mockResolvedValue({}) },
          passwordHistory: { create: vi.fn().mockResolvedValue({}) },
          passwordResetToken: { update: vi.fn().mockResolvedValue({}) },
          refreshToken: { updateMany: vi.fn().mockResolvedValue({}) },
        };
        capturedTx = tx;
        return fn(tx);
      });
      prismaMock.securityEvent.create.mockResolvedValue({ id: 'se-2' });

      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);

      const result = await service.confirmReset(token, newPassword);

      expect(result.message).toContain('réinitialisé avec succès');
      expect(capturedTx.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(capturedTx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({ passwordHash: expect.any(String) }),
      });
      expect(capturedTx.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: { type: 'PASSWORD_RESET_CONFIRM', userId, email, details: { motDePasseModifie: true } },
      });
    });

    it('devrait lever UnauthorizedException si le token est invalide', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.confirmReset('invalid-token', 'NewPass12!')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever UnauthorizedException si le token est déjà utilisé', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: token, usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), user: baseUser,
      });
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.confirmReset(token, 'NewPass12!')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever UnauthorizedException si le token est expiré', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: token, usedAt: null,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), user: baseUser,
      });
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.confirmReset(token, 'NewPass12!')).rejects.toThrow(UnauthorizedException);
    });

    it('devrait lever BadRequestException PASSWORD_POLICY si le mot de passe est trop court', async () => {
      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: token, usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        user: { ...baseUser, id: userId },
      });
      prismaMock.parametreSecurite.findUnique.mockResolvedValue({ longueurMin: 12, historique: 5 });
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.confirmReset(token, 'short')).rejects.toMatchObject({
        response: { errorCode: 'PASSWORD_POLICY' },
      });
    });

    it('devrait lever BadRequestException PASSWORD_POLICY si le mot de passe est dans l’historique', async () => {
      const oldPassword = 'AncienSuperPass12!';
      const oldHash = await hashPassword(oldPassword);

      const prismaMock = buildPrismaMock();
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'rt-1', tokenHash: token, usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        user: { ...baseUser, id: userId },
      });
      prismaMock.parametreSecurite.findUnique.mockResolvedValue({ longueurMin: 12, historique: 5 });
      prismaMock.passwordHistory.findMany.mockResolvedValue([{ id: 'ph-1', userId, passwordHash: oldHash, createdAt: new Date() }]);
      const { module } = buildModule(prismaMock);
      const service = (await module.compile()).get(PasswordResetService);
      await expect(service.confirmReset(token, oldPassword)).rejects.toMatchObject({
        response: { errorCode: 'PASSWORD_POLICY' },
      });
    });
  });
});