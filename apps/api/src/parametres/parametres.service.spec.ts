// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Unit tests for Parametres service (L5-17)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ParametresService } from './parametres.service.js';
import type { WorkflowParamsUpdateDto } from './dto/workflow-params-update.dto.js';

vi.mock('../audit/audit.service.js', () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    auditTransaction: vi.fn(async (operation: unknown) =>
      (operation as (tx: unknown) => Promise<unknown>)({}),
    ),
  })),
}));

describe('ParametresService', () => {
  let service: ParametresService;
  let prisma: any;
  let audit: any;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const now = new Date('2026-10-25T10:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      parametreWorkflow: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(prisma)),
    };

    audit = {
      auditTransaction: vi.fn(async (operation: unknown) =>
        (operation as (tx: unknown) => Promise<unknown>)(prisma),
      ),
    };

    service = new ParametresService(prisma as any, audit as any);
  });

  describe('getParams', () => {
    it('returns existing parameters', async () => {
      prisma.parametreWorkflow.findUnique.mockResolvedValue({
        id: 1,
        validationPlanningRequise: true,
        publicationRequise: false,
        updatedAt: now,
        updatedBy: userId,
      });

      const result = await service.getParams();

      expect(result).toEqual({
        validationPlanningRequise: true,
        publicationRequise: false,
        updatedAt: now,
        updatedBy: userId,
      });
    });

    it('throws NotFoundException when no row exists', async () => {
      prisma.parametreWorkflow.findUnique.mockResolvedValue(null);

      await expect(service.getParams()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateParams', () => {
    const dto: WorkflowParamsUpdateDto = {
      validationPlanningRequise: true,
      publicationRequise: true,
      motif: 'Mise à jour de test',
    };

    it('updates both fields and writes audit', async () => {
      const avant = {
        id: 1,
        validationPlanningRequise: false,
        publicationRequise: false,
      };
      const apres = {
        id: 1,
        validationPlanningRequise: true,
        publicationRequise: true,
        updatedAt: now,
        updatedBy: userId,
      };

      prisma.parametreWorkflow.findUnique.mockResolvedValue(avant);
      prisma.parametreWorkflow.update.mockResolvedValue(apres);
      audit.auditTransaction.mockImplementation(async (operation: unknown) =>
        (operation as (tx: any) => Promise<unknown>)(prisma),
      );

      const result = await service.updateParams(dto, userId);

      expect(result).toEqual({
        validationPlanningRequise: true,
        publicationRequise: true,
        updatedAt: now,
        updatedBy: userId,
      });
      expect(audit.auditTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          userId,
          action: 'UPDATE',
          objetType: 'ParametreWorkflow',
          objetId: '1',
          ancienneValeur: {
            validationPlanningRequise: false,
            publicationRequise: false,
          },
          nouvelleValeur: {
            validationPlanningRequise: true,
            publicationRequise: true,
          },
          motif: 'Mise à jour de test',
        }),
      );
    });

    it('updates a single field and preserves the other', async () => {
      const dtoPartiel: WorkflowParamsUpdateDto = { validationPlanningRequise: false };
      const avant = {
        id: 1,
        validationPlanningRequise: true,
        publicationRequise: true,
      };
      const apres = {
        id: 1,
        validationPlanningRequise: false,
        publicationRequise: true,
        updatedAt: now,
        updatedBy: userId,
      };

      prisma.parametreWorkflow.findUnique.mockResolvedValue(avant);
      prisma.parametreWorkflow.update.mockResolvedValue(apres);
      audit.auditTransaction.mockImplementation(async (operation: unknown) =>
        (operation as (tx: any) => Promise<unknown>)(prisma),
      );

      const result = await service.updateParams(dtoPartiel, userId);

      expect(result).toEqual({
        validationPlanningRequise: false,
        publicationRequise: true,
        updatedAt: now,
        updatedBy: userId,
      });
      expect(audit.auditTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          nouvelleValeur: {
            validationPlanningRequise: false,
            publicationRequise: true,
          },
        }),
      );
    });

    it('throws BadRequestException when no field is present', async () => {
      const dtoVide: WorkflowParamsUpdateDto = {};

      await expect(service.updateParams(dtoVide, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.parametreWorkflow.findUnique).not.toHaveBeenCalled();
      expect(audit.auditTransaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when row does not exist', async () => {
      prisma.parametreWorkflow.findUnique.mockResolvedValue(null);

      await expect(service.updateParams(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(audit.auditTransaction).not.toHaveBeenCalled();
    });
  });
});