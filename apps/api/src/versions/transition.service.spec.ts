// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires des transitions de version (L5-01)
// POST /versions/{id}/transitions
import { NotFoundException, ConflictException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionService } from './version.service.js';
import type { TransitionType } from '@takt/contracts';

// ============================================
// VersionService.transition (L5-01)
// ============================================

describe('VersionService.transition', () => {
  let service: VersionService;
  let prisma: any;

  const versionId = 'version-1';
  const userId = 'user-1';

  beforeEach(async () => {
    prisma = {
      versionEdt: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      seance: {
        findFirst: vi.fn(),
      },
      workflowTransition: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (fn: any) => fn(prisma)),
    };

    const preparationService = { getPreparation: vi.fn() };
    const conflitService = { recomputeConflits: vi.fn() };
    const bossMock = { send: vi.fn().mockResolvedValue('job-id') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: preparationService },
        { provide: ConflitService, useValue: conflitService },
        { provide: 'BOSS', useValue: bossMock },
      ],
    }).compile();

    service = module.get(VersionService);
  });

  // ------------------------------------------------------------------
  // DEMARRER_EDITION : BROUILLON → EDITION (garde : ≥1 séance NON_PLACEE)
  // ------------------------------------------------------------------
  it('DEMARRER_EDITION : passe BROUILLON → EDITION, incrémente revision, écrit WorkflowTransition et audit', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'BROUILLON', revision: 0 } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EDITION', revision: 1 } as any);
    prisma.seance.findFirst.mockResolvedValue({ id: 'seance-1' } as any);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'EDITION',
      revision: 1,
    } as any);

    const result = await service.transition(versionId, 'DEMARRER_EDITION', userId);

    expect(result.versionId).toBe(versionId);
    expect(result.de).toBe('BROUILLON');
    expect(result.vers).toBe('EDITION');
    expect(result.action).toBe('DEMARRER_EDITION');
    expect(result.revision).toBe(1);
    expect(prisma.versionEdt.update).toHaveBeenCalledWith({
      where: { id: versionId },
      data: { statut: 'EDITION', revision: { increment: 1 } },
    });
    expect(prisma.workflowTransition.create).toHaveBeenCalledWith({
      data: {
        versionId,
        de: 'BROUILLON',
        vers: 'EDITION',
        userId,
        automatique: false,
        commentaire: null,
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('DEMARRER_EDITION : 409 si aucune séance NON_PLACEE (garde)', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'BROUILLON',
      revision: 0,
    } as any);
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(service.transition(versionId, 'DEMARRER_EDITION', userId)).rejects.toThrow(
      ConflictException,
    );
  });

  // ------------------------------------------------------------------
  // MARQUER_PRET : EDITION → PRET_POUR_VALIDATION (garde : 0 séance NON_PLACEE)
  // ------------------------------------------------------------------
  it('MARQUER_PRET : passe EDITION → PRET_POUR_VALIDATION quand aucune séance NON_PLACEE', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EDITION', revision: 2 } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'PRET_POUR_VALIDATION', revision: 3 } as any);
    prisma.seance.findFirst.mockResolvedValue(null);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'PRET_POUR_VALIDATION',
      revision: 3,
    } as any);

    const result = await service.transition(versionId, 'MARQUER_PRET', userId);

    expect(result.de).toBe('EDITION');
    expect(result.vers).toBe('PRET_POUR_VALIDATION');
    expect(result.action).toBe('MARQUER_PRET');
    expect(result.revision).toBe(3);
  });

  it('MARQUER_PRET : 409 si des séances NON_PLACEE restent', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'EDITION',
      revision: 2,
    } as any);
    prisma.seance.findFirst.mockResolvedValue({ id: 'seance-1' } as any);

    await expect(service.transition(versionId, 'MARQUER_PRET', userId)).rejects.toThrow(
      ConflictException,
    );
  });

  // ------------------------------------------------------------------
  // SOUMETTRE : PRET_POUR_VALIDATION → EN_VALIDATION
  // ------------------------------------------------------------------
  it('SOUMETTRE : passe PRET_POUR_VALIDATION → EN_VALIDATION', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'PRET_POUR_VALIDATION', revision: 3 } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EN_VALIDATION', revision: 4 } as any);
    prisma.seance.findFirst.mockResolvedValue(null);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'EN_VALIDATION',
      revision: 4,
    } as any);

    const result = await service.transition(versionId, 'SOUMETTRE', userId);

    expect(result.de).toBe('PRET_POUR_VALIDATION');
    expect(result.vers).toBe('EN_VALIDATION');
    expect(result.action).toBe('SOUMETTRE');
    expect(result.revision).toBe(4);
  });

  // ------------------------------------------------------------------
  // REPRENDRE : PRET_POUR_VALIDATION → EDITION
  // ------------------------------------------------------------------
  it('REPRENDRE : passe PRET_POUR_VALIDATION → EDITION', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'PRET_POUR_VALIDATION', revision: 3 } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EDITION', revision: 4 } as any);
    prisma.seance.findFirst.mockResolvedValue(null);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'EDITION',
      revision: 4,
    } as any);

    const result = await service.transition(versionId, 'REPRENDRE', userId);

    expect(result.de).toBe('PRET_POUR_VALIDATION');
    expect(result.vers).toBe('EDITION');
    expect(result.action).toBe('REPRENDRE');
  });

  // ------------------------------------------------------------------
  // RESOUMETTRE : CORRECTION → EN_VALIDATION
  // ------------------------------------------------------------------
  it('RESOUMETTRE : passe CORRECTION → EN_VALIDATION', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'CORRECTION', revision: 5 } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EN_VALIDATION', revision: 6 } as any);
    prisma.seance.findFirst.mockResolvedValue(null);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'EN_VALIDATION',
      revision: 6,
    } as any);

    const result = await service.transition(versionId, 'RESOUMETTRE', userId);

    expect(result.de).toBe('CORRECTION');
    expect(result.vers).toBe('EN_VALIDATION');
    expect(result.action).toBe('RESOUMETTRE');
    expect(result.revision).toBe(6);
  });

  // ------------------------------------------------------------------
  // ABANDONNER : tout statut non publié → ARCHIVE
  // ------------------------------------------------------------------
  it('ABANDONNER : passe EDITION → ARCHIVE avec commentaire', async () => {
    prisma.versionEdt.findUnique
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'EDITION', revision: 2, motif: null } as any)
      .mockResolvedValueOnce({ id: versionId, numero: '1.0', statut: 'ARCHIVE', revision: 3 } as any);
    prisma.versionEdt.update.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'ARCHIVE',
      revision: 3,
    } as any);

    const result = await service.transition(
      versionId,
      'ABANDONNER',
      userId,
      'Plus besoin de cette version',
    );

    expect(result.de).toBe('EDITION');
    expect(result.vers).toBe('ARCHIVE');
    expect(result.action).toBe('ABANDONNER');
    expect(result.commentaire).toBe('Plus besoin de cette version');
    expect(result.revision).toBe(3);
    expect(prisma.workflowTransition.create).toHaveBeenCalledWith({
      data: {
        versionId,
        de: 'EDITION',
        vers: 'ARCHIVE',
        userId,
        automatique: false,
        commentaire: 'Plus besoin de cette version',
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'VERSION_ABANDONNER',
        objetType: 'VersionEdt',
        objetId: versionId,
      }),
    });
  });

  it('ABANDONNER : 409 si version déjà PUBLIE', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'PUBLIE',
      revision: 4,
    } as any);

    await expect(service.transition(versionId, 'ABANDONNER', userId)).rejects.toThrow(
      ConflictException,
    );
  });

  // ------------------------------------------------------------------
  // Erreurs
  // ------------------------------------------------------------------
  it('404 : version introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);

    await expect(service.transition(versionId, 'DEMARRER_EDITION', userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('409 : action interdite depuis le statut courant', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      numero: '1.0',
      statut: 'PUBLIE',
      revision: 4,
    } as any);

    await expect(service.transition(versionId, 'DEMARRER_EDITION', userId)).rejects.toThrow(
      ConflictException,
    );
  });
});