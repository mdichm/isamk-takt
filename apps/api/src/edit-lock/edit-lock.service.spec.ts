// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service EditLock (L3-19)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditLockService } from './edit-lock.service.js';
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
  PrismaClient: class {},
}));

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
  })),
}));

const prisma: any = {};
let audit: any = {};

describe('EditLockService', () => {
  let service: EditLockService;

  const versionId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '550e8400-e29b-41d4-a716-446655440002';


  beforeEach(() => {
    vi.clearAllMocks();

    prisma.versionEdt = {
      findUnique: vi.fn(),
    };
    prisma.editLock = {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    };
    prisma.$transaction = vi.fn(async (operation: any) => operation(prisma));

    audit = {
      writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
    };

    service = new EditLockService(prisma as any, audit as any);
  });

  describe('acquire', () => {
    const currentUser = { id: userId, role: RoleCode.GESTIONNAIRE };

    it('acquiert un bail quand aucun n existe', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: 'BROUILLON' });
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.editLock.upsert.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.acquire(versionId, userId, currentUser);

      expect(result.versionId).toBe(versionId);
      expect(result.userId).toBe(userId);
      expect(prisma.editLock.upsert).toHaveBeenCalledTimes(1);
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('renouvelle le bail si deja detenir par le meme utilisateur', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: 'BROUILLON' });
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt,
      });
      prisma.editLock.upsert.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const result = await service.acquire(versionId, userId, currentUser);

      expect(result.userId).toBe(userId);
      expect(prisma.editLock.upsert).toHaveBeenCalledTimes(1);
    });

    it('rejette avec 423 si un autre utilisateur detient le bail', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: 'BROUILLON' });
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });

      await expect(
        service.acquire(versionId, userId, currentUser),
      ).rejects.toMatchObject({
        response: { code: 'EDIT_LOCK_HELD' },
      });

      expect(prisma.editLock.upsert).not.toHaveBeenCalled();
    });

    it('rejette si la version est introuvable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);

      await expect(
        service.acquire(versionId, userId, currentUser),
      ).rejects.toThrow(/introuvable/);
    });

    it('reprend un bail expire', async () => {
      const expiredAt = new Date(Date.now() - 10 * 60 * 1000);
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: 'BROUILLON' });
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt: expiredAt,
      });
      prisma.editLock.upsert.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const result = await service.acquire(versionId, userId, currentUser);

      expect(result.userId).toBe(userId);
      expect(prisma.editLock.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('heartbeat', () => {
    const currentUser = { id: userId, role: RoleCode.GESTIONNAIRE };

    it('renouvelle le bail pour le propriettaire', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt,
      });
      prisma.editLock.upsert.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const result = await service.heartbeat(versionId, userId, currentUser);

      expect(result.userId).toBe(userId);
      expect(prisma.editLock.upsert).toHaveBeenCalledTimes(1);
    });

    it('refuse le heartbeat si aucun bail existe', async () => {
      prisma.editLock.findUnique.mockResolvedValue(null);

      await expect(
        service.heartbeat(versionId, userId, currentUser),
      ).rejects.toThrow(/Aucun bail actif/);
    });

    it('refuse le heartbeat si pas le propriettaire ni admin', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });

      const otherUser = { id: userId, role: RoleCode.RESPONSABLE_DEPARTEMENT };

      await expect(
        service.heartbeat(versionId, userId, otherUser),
      ).rejects.toThrow(/Seul le détenteur/);
    });

    it('autorise le heartbeat par un administrateur', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });
      prisma.editLock.upsert.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const admin = { id: 'admin-1', role: RoleCode.ADMINISTRATEUR };

      const result = await service.heartbeat(versionId, otherUserId, admin);

      expect(result.userId).toBe(otherUserId);
    });
  });

  describe('release', () => {
    const currentUser = { id: userId, role: RoleCode.GESTIONNAIRE };

    it('libere le bail pour le propriettaire', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId,
        expiresAt,
      });
      prisma.editLock.delete.mockResolvedValue({ id: 'lock-1' });

      await service.release(versionId, userId, currentUser);

      expect(prisma.editLock.delete).toHaveBeenCalledWith({ where: { versionId } });
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('ne fait rien si aucun bail existe (idempotent)', async () => {
      prisma.editLock.findUnique.mockResolvedValue(null);

      await service.release(versionId, userId, currentUser);

      expect(prisma.editLock.delete).not.toHaveBeenCalled();
      expect(audit.writeAudit).not.toHaveBeenCalled();
    });

    it('refuse la liberation par un tiers non-admin', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });

      const otherUser = { id: userId, role: RoleCode.RESPONSABLE_DEPARTEMENT };

      await expect(
        service.release(versionId, userId, otherUser),
      ).rejects.toThrow(/propre bail/);
    });

    it('autorise la liberation forcee par un administrateur', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });
      prisma.editLock.delete.mockResolvedValue({ id: 'lock-1' });

      const admin = { id: 'admin-1', role: RoleCode.ADMINISTRATEUR };

      await service.release(versionId, otherUserId, admin, true);

      expect(prisma.editLock.delete).toHaveBeenCalledWith({ where: { versionId } });
      expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    });

    it('refuse la liberation forcee par un non-admin', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        versionId,
        userId: otherUserId,
        expiresAt,
      });

      const nonAdmin = { id: userId, role: RoleCode.RESPONSABLE_DEPARTEMENT };

      await expect(
        service.release(versionId, otherUserId, nonAdmin, true),
      ).rejects.toThrow(/administrateur/);
    });
  });
});