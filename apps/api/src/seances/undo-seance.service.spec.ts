// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service d'annulation de déplacement de séance (L3-24)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RoleCode, VersionStatut, VerrouType } from '@takt/db';
import { UndoSeanceService } from './undo-seance.service.js';
import { UndoSeanceDto } from './dto/undo-seance.dto.js';

describe('UndoSeanceService', () => {
  let service: UndoSeanceService;
  let prisma: any;
  let conflitService: any;
  let audit: any;

  const seanceId = 'seance-1';
  const versionId = 'version-1';
  const userId = 'user-1';

  const seance = {
    id: seanceId,
    versionId,
    semestreId: 'semestre-1',
    enseignantId: 'enseignant-1',
    salleId: 'salle-0',
    jour: 'MARDI',
    creneauDebutId: 'creneau-2',
    nbCreneaux: 1,
    statut: 'PLACEE',
    tag: null,
    revision: 5,
    seanceGroupes: [{ groupeId: 'groupe-1' }],
  };

  const ancienneValeur = {
    jour: 'LUNDI',
    creneauDebutId: 'creneau-1',
    salleId: 'salle-0',
    statut: 'PLACEE',
    revision: 4,
  };

  const userGestionnaire = { id: userId, role: RoleCode.GESTIONNAIRE };
  const userAdmin = { id: 'admin-1', role: RoleCode.ADMINISTRATEUR };

  beforeEach(() => {
    prisma = {
      seance: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      versionEdt: { findUnique: vi.fn() },
      editLock: { findUnique: vi.fn() },
      verrouSeance: { findMany: vi.fn() },
      auditLog: { findFirst: vi.fn() },
      occupation: { deleteMany: vi.fn(), create: vi.fn() },
      $transaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    conflitService = {
      recomputeConflits: vi.fn(async () => []),
    };

    audit = {
      writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
    };

    service = new UndoSeanceService(prisma as any, conflitService as any, audit as any);
  });

  const mockSuccess = () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([]);
    prisma.auditLog.findFirst.mockResolvedValue({
      id: 'audit-100',
      at: new Date(),
      ancienneValeur,
      nouvelleValeur: { jour: 'MARDI', creneauDebutId: 'creneau-2', salleId: 'salle-0', statut: 'PLACEE', revision: 5 },
      userId,
    } as any);
    prisma.seance.update.mockResolvedValue({
      ...seance,
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      revision: 6,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      ...seance,
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      revision: 6,
      occupations: [],
    } as any);
  };

  it('annule le dernier déplacement et restaure la position précédente', async () => {
    mockSuccess();

    const dto: UndoSeanceDto = { motif: 'Annulation test' };

    const result = await service.undo(seanceId, '5', userGestionnaire, dto);

    expect(result.jour).toBe('LUNDI');
    expect(result.creneauDebutId).toBe('creneau-1');
    expect(result.revision).toBe(6);
    expect(prisma.seance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: seanceId },
        data: expect.objectContaining({
          jour: 'LUNDI',
          creneauDebutId: 'creneau-1',
          revision: { increment: 1 },
        }),
      }),
    );
    expect(audit.writeAudit).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        action: 'SEANCE_ANNULE',
        objetId: seanceId,
        versionId,
        motif: 'Annulation test',
      }),
    );
    expect(conflitService.recomputeConflits).toHaveBeenCalledWith(versionId);
  });

  it('lève 412 si la révision If-Match est périmée', async () => {
    mockSuccess();

    await expect(
      service.undo(seanceId, '4', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toMatchObject({
      status: 412,
    });

    expect(prisma.seance.update).not.toHaveBeenCalled();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('lève 403 si aucun bail d\'édition actif', async () => {
    mockSuccess();
    prisma.editLock.findUnique.mockResolvedValue(null);

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('lève 403 si le bail est détenu par un autre utilisateur', async () => {
    mockSuccess();
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId: 'autre-utilisateur',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('lève 409 si la version est publiée', async () => {
    mockSuccess();
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.PUBLIE });

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(ConflictException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('lève 404 si aucun historique de déplacement n\'est trouvé', async () => {
    mockSuccess();
    prisma.auditLog.findFirst.mockResolvedValue(null);

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('lève 404 si la séance est introuvable', async () => {
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('lève 409 si un verrou bloquant est actif sur la séance', async () => {
    mockSuccess();
    prisma.verrouSeance.findMany.mockResolvedValue([{
      id: 'verrou-1',
      seanceId,
      type: VerrouType.SALLE,
      leveLe: null,
      auteurId: 'auteur-1',
      creeLe: new Date(),
    }]);

    await expect(
      service.undo(seanceId, '5', userGestionnaire, {} as UndoSeanceDto),
    ).rejects.toThrow(ConflictException);

    expect(prisma.seance.update).not.toHaveBeenCalled();
  });

  it('autorise un administrateur même si le bail est détenu par un autre', async () => {
    mockSuccess();
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId: 'autre-utilisateur',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const result = await service.undo(seanceId, '5', userAdmin, {} as UndoSeanceDto);

    expect(result.jour).toBe('LUNDI');
    expect(prisma.seance.update).toHaveBeenCalled();
  });
});
