// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'acceptation des avertissements (L3-39)
import {
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ConflitSeverite } from '@takt/db';
import { AvertissementService } from './avertissement.service.js';

// ============================================
// AvertissementService (L3-39)
// ============================================

describe('AvertissementService', () => {
  let service: AvertissementService;
  let prisma: any;
  let audit: any;

  const versionId = 'version-1';
  const signature = 'sig-1';
  const userId = 'user-1';

  beforeEach(async () => {
    prisma = {
      versionEdt: { findUnique: vi.fn() },
      conflit: { findFirst: vi.fn() },
      avertissementAccepte: { count: vi.fn(), create: vi.fn() },
      $transaction: vi.fn(),
    };

    audit = {
      writeAudit: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvertissementService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get(AvertissementService);
  });
  it('accepte un avertissement AVERTISSEMENT, le trace et l audite', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'BROUILLON',
    } as any);

    prisma.conflit.findFirst.mockResolvedValue({
      id: 'conflit-1',
      versionId,
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      severite: ConflitSeverite.AVERTISSEMENT,
      signature,
      seanceIds: ['seance-1', 'seance-2'],
      message: 'Equipement souhaite manquant',
      details: { equipements: ['VIDEOPROJECTEUR'] },
      resoluLe: null,
    } as any);

    prisma.avertissementAccepte.count.mockResolvedValue(0);

    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        ...prisma,
        avertissementAccepte: {
          create: prisma.avertissementAccepte.create,
        },
      };
      return cb(tx);
    });

    prisma.avertissementAccepte.create.mockResolvedValue({
      id: 'accepte-1',
      versionId,
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      signature,
      seanceIds: ['seance-1', 'seance-2'],
      auteurId: userId,
      justification: 'Justification test',
      versionRevision: 0,
      acceptePar: userId,
      accepteLe: new Date(),
      caduqueLe: null,
    } as any);

    const result = await service.accept(
      versionId,
      signature,
      'Justification test',
      { id: userId, role: 'GESTIONNAIRE' },
    );

    expect(result.id).toBe('accepte-1');
    expect(result.signature).toBe(signature);
    expect(result.regleCode).toBe('SALLE_SOUHAITE_MANQUANT');
    expect(result.caduqueLe).toBeUndefined();
    expect(result.impact.seanceIds).toEqual(['seance-1', 'seance-2']);
    expect(result.impact.regleCode).toBe('SALLE_SOUHAITE_MANQUANT');
    expect(prisma.avertissementAccepte.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          versionId,
          signature,
          regleCode: 'SALLE_SOUHAITE_MANQUANT',
          auteurId: userId,
          acceptePar: userId,
        }),
      }),
    );
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
  });
  it('rejette avec 422 BLOCKING_NOT_ACCEPTABLE pour un conflit bloquant', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'BROUILLON',
    } as any);

    prisma.conflit.findFirst.mockResolvedValue({
      id: 'conflit-1',
      versionId,
      regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
      severite: ConflitSeverite.BLOQUANT,
      signature,
      seanceIds: ['seance-1'],
      message: 'Double booking enseignant',
      resoluLe: null,
    } as any);

    await expect(
      service.accept(versionId, signature, undefined, {
        id: userId,
        role: 'GESTIONNAIRE',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    });

    // L avertissement ne doit pas etre ni cree ni audite
    expect(prisma.avertissementAccepte.create).not.toHaveBeenCalled();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('leve NotFoundException si la version est introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);

    await expect(
      service.accept(versionId, signature, undefined, {
        id: userId,
        role: 'GESTIONNAIRE',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('leve NotFoundException si aucun conflit non resolu avec cette signature', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'BROUILLON',
    } as any);

    prisma.conflit.findFirst.mockResolvedValue(null);

    await expect(
      service.accept(versionId, signature, undefined, {
        id: userId,
        role: 'GESTIONNAIRE',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('ne modifie jamais la severite stockee dans Conflit', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'BROUILLON',
    } as any);

    prisma.conflit.findFirst.mockResolvedValue({
      id: 'conflit-1',
      versionId,
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      severite: ConflitSeverite.AVERTISSEMENT,
      signature,
      seanceIds: ['seance-1'],
      message: 'Avertissement',
      resoluLe: null,
    } as any);

    prisma.avertissementAccepte.count.mockResolvedValue(0);
    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        ...prisma,
        avertissementAccepte: {
          create: prisma.avertissementAccepte.create,
        },
      };
      return cb(tx);
    });
    prisma.avertissementAccepte.create.mockResolvedValue({
      id: 'accepte-1',
      versionId,
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      signature,
      seanceIds: ['seance-1'],
      auteurId: userId,
      justification: undefined,
      versionRevision: 0,
      acceptePar: userId,
      accepteLe: new Date(),
      caduqueLe: null,
    } as any);

    await service.accept(versionId, signature, undefined, {
      id: userId,
      role: 'GESTIONNAIRE',
    });

    // Aucun update sur Conflit n'est appele : la severite est intacte.
    expect(prisma.conflit.update).toBeUndefined();
    expect(prisma.conflit.updateMany).toBeUndefined();
  });
});
