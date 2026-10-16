// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'audit métier (EX-AUD-01, ST §2.4, §0.5)
// @takt/db est mocké car le PrismaClient nécessite une base de données au chargement.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from './audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WriteAuditDto } from './dto/audit.dto.js';

vi.mock('@takt/db', () => {
  class PrismaClientMock {}
  return {
    PrismaClient: PrismaClientMock,
    Prisma: {
      JsonNull: {},
    },
    RoleCode: {
      ADMINISTRATEUR: 'ADMINISTRATEUR',
      GESTIONNAIRE: 'GESTIONNAIRE',
      RESPONSABLE_DEPARTEMENT: 'RESPONSABLE_DEPARTEMENT',
      DIRECTION: 'DIRECTION',
    },
  };
});

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockAuditLogCreate = vi.fn();
  const mockAuditLogFindMany = vi.fn();
  const mockAuditLogCount = vi.fn();
  const mockTransaction = vi.fn();

  const mockTx = {
    auditLog: { create: mockAuditLogCreate, findMany: mockAuditLogFindMany, count: mockAuditLogCount },
    $transaction: mockTransaction,
  } as unknown as PrismaService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockTx;
    service = new AuditService(prisma);
  });

  it('should write an audit entry with old and new values', async () => {
    const auditData: WriteAuditDto = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'UPDATE',
      objetType: 'User',
      objetId: '550e8400-e29b-41d4-a716-446655440001',
      ancienneValeur: { email: 'old@test.com' },
      nouvelleValeur: { email: 'new@test.com' },
      motif: 'Modification du profil',
    };

    const expectedAudit = {
      id: 1n,
      at: new Date('2026-10-16T12:00:00Z'),
      userId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'UPDATE',
      objetType: 'User',
      objetId: '550e8400-e29b-41d4-a716-446655440001',
      ancienneValeur: { email: 'old@test.com' },
      nouvelleValeur: { email: 'new@test.com' },
      versionId: null,
      motif: 'Modification du profil',
      requestId: null,
      ip: null,
    };

    mockAuditLogCreate.mockResolvedValue(expectedAudit);

    const result = await service.writeAudit(mockTx, auditData);

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        action: 'UPDATE',
        objetType: 'User',
        objetId: '550e8400-e29b-41d4-a716-446655440001',
        ancienneValeur: { email: 'old@test.com' },
        nouvelleValeur: { email: 'new@test.com' },
        versionId: null,
        motif: 'Modification du profil',
        requestId: null,
        ip: null,
      },
    });
    expect(result.id).toBe('1');
    expect(result.action).toBe('UPDATE');
    expect(result.objetType).toBe('User');
    expect(result.ancienneValeur).toEqual({ email: 'old@test.com' });
    expect(result.nouvelleValeur).toEqual({ email: 'new@test.com' });
    expect(result.motif).toBe('Modification du profil');
  });

  it('should execute operation and audit in the same transaction (atomicity)', async () => {
    const operation = vi.fn().mockResolvedValue({ id: 'biz-1' });
    const auditData: WriteAuditDto = {
      action: 'CREATE',
      objetType: 'User',
      objetId: '550e8400-e29b-41d4-a716-446655440001',
    };

    const createdAudit = {
      id: 1n,
      at: new Date(),
      userId: null,
      action: 'CREATE',
      objetType: 'User',
      objetId: '550e8400-e29b-41d4-a716-446655440001',
      ancienneValeur: null,
      nouvelleValeur: null,
      versionId: null,
      motif: null,
      requestId: null,
      ip: null,
    };
    mockAuditLogCreate.mockResolvedValue(createdAudit);
    mockTransaction.mockImplementation(async (fn: (tx: PrismaService) => Promise<unknown>) => {
      return fn(mockTx);
    });

    const result = await service.auditTransaction(operation, auditData);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(mockTx);
    expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'biz-1' });
  });

  it('should rollback both business operation and audit when operation fails', async () => {
    const error = new Error('Business failure');
    const operation = vi.fn().mockRejectedValue(error);
    const auditData: WriteAuditDto = {
      action: 'UPDATE',
      objetType: 'User',
      objetId: '550e8400-e29b-41d4-a716-446655440001',
    };

    mockTransaction.mockImplementation(async (fn: (tx: PrismaService) => Promise<unknown>) => {
      try {
        return await fn(mockTx);
      } catch {
        throw error;
      }
    });

    await expect(service.auditTransaction(operation, auditData)).rejects.toThrow('Business failure');

    expect(operation).toHaveBeenCalledWith(mockTx);
    // L'audit n'est pas écrit car l'opération a levé avant l'écriture d'audit
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    const currentUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      role: 'ADMINISTRATEUR' as const,
      departments: undefined as string[] | undefined,
    };

    const mockAuditEntries = [
      {
        id: 1n,
        at: new Date('2026-10-16T12:00:00Z'),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        action: 'CREATE',
        objetType: 'User',
        objetId: '550e8400-e29b-41d4-a716-446655440001',
        ancienneValeur: null,
        nouvelleValeur: { email: 'new@test.com' },
        versionId: null,
        motif: null,
        requestId: null,
        ip: null,
      },
    ];

    it('should return paginated audit entries for administrator', async () => {
      mockAuditLogFindMany.mockResolvedValue(mockAuditEntries);
      mockAuditLogCount.mockResolvedValue(1);

      const result = await service.findAll(
        { limit: 50 },
        currentUser,
      );

      expect(mockAuditLogFindMany).toHaveBeenCalledWith({
        where: {},
        take: 51,
        skip: 0,
        cursor: undefined,
        orderBy: { at: 'desc' },
      });
      expect(mockAuditLogCount).toHaveBeenCalledWith({ where: {} });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].action).toBe('CREATE');
      expect(result.nextCursor).toBeNull();
    });

    it('should filter by objetType, objetId, userId, from, to', async () => {
      mockAuditLogFindMany.mockResolvedValue([]);
      mockAuditLogCount.mockResolvedValue(0);

      await service.findAll(
        {
          objetType: 'User',
          objetId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          from: '2026-10-01T00:00:00Z',
          to: '2026-10-31T23:59:59Z',
          limit: 25,
          cursor: '100',
        },
        currentUser,
      );

      expect(mockAuditLogFindMany).toHaveBeenCalledWith({
        where: {
          objetType: 'User',
          objetId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          at: { gte: new Date('2026-10-01T00:00:00Z'), lte: new Date('2026-10-31T23:59:59Z') },
        },
        take: 26,
        skip: 1,
        cursor: { id: 100n },
        orderBy: { at: 'desc' },
      });
    });

    it('should restrict GESTIONNAIRE and RESPONSABLE_DEPARTEMENT to their own actions', async () => {
      mockAuditLogFindMany.mockResolvedValue([]);
      mockAuditLogCount.mockResolvedValue(0);

      const gestionnaire = { ...currentUser, role: 'GESTIONNAIRE' as const, id: 'gestionnaire-id' };
      await service.findAll({ limit: 50 }, gestionnaire);

      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'gestionnaire-id' }),
        }),
      );

      const responsable = { ...currentUser, role: 'RESPONSABLE_DEPARTEMENT' as const, id: 'responsable-id' };
      await service.findAll({ limit: 50 }, responsable);

      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'responsable-id' }),
        }),
      );
    });

    it('should allow DIRECTION to see all audit entries', async () => {
      mockAuditLogFindMany.mockResolvedValue([]);
      mockAuditLogCount.mockResolvedValue(0);

      const direction = { ...currentUser, role: 'DIRECTION' as const };
      await service.findAll({ limit: 50 }, direction);

      const call = mockAuditLogFindMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('userId');
    });

    it('should paginate with cursor and detect next page', async () => {
      const twoPages = [...mockAuditEntries, { ...mockAuditEntries[0], id: 2n }];
      mockAuditLogFindMany.mockResolvedValue(twoPages);
      mockAuditLogCount.mockResolvedValue(2);

      const result = await service.findAll({ limit: 1, cursor: '1' }, currentUser);

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBe('1');
    });
  });
});
