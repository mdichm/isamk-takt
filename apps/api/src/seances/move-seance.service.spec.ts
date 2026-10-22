// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de déplacement d'une séance (L3-20)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RoleCode, VersionStatut, SeanceStatut } from '@takt/db';
import { validatePlacement } from '@takt/conflict-engine';
import { MoveSeanceService } from './move-seance.service.js';
import { MoveSeanceDto } from './dto/move-seance.dto.js';

vi.mock('@takt/conflict-engine', async (importActual) => {
  const actual = await importActual<typeof import('@takt/conflict-engine')>();
  return {
    ...actual,
    validatePlacement: vi.fn(),
  };
});

describe('MoveSeanceService', () => {
  let service: MoveSeanceService;
  let prisma: any;
  let conflitService: any;
  let audit: any;

  const seanceId = 'seance-1';
  const versionId = 'version-1';
  const userId = 'user-1';

  const dto: MoveSeanceDto = {
    jour: 'LUNDI',
    creneauDebutId: 'creneau-1',
    salleId: 'salle-1',
  };

  const seance = {
    id: seanceId,
    versionId,
    semestreId: 'semestre-1',
    enseignantId: 'enseignant-1',
    salleId: 'salle-0',
    jour: 'MARDI',
    creneauDebutId: 'creneau-0',
    nbCreneaux: 1,
    statut: SeanceStatut.NON_PLACEE,
    tag: null,
    revision: 3,
    seanceGroupes: [{ groupeId: 'groupe-1' }],
  };

  const ctx: any = {
    versionId,
    grille: {
      consecutifs: vi.fn(() => ['LUNDI|creneau-1']),
    },
  };

  const userGestionnaire = { id: userId, role: RoleCode.GESTIONNAIRE };
  const userAdmin = { id: 'admin-1', role: RoleCode.ADMINISTRATEUR };

  beforeEach(() => {
    vi.mocked(validatePlacement).mockReturnValue([]);

    prisma = {
      seance: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      versionEdt: { findUnique: vi.fn() },
      editLock: { findUnique: vi.fn() },
      verrouSeance: { findMany: vi.fn() },
      occupation: { deleteMany: vi.fn(), create: vi.fn() },
      $transaction: vi.fn(async (operation: any) => operation(prisma)),
    };

    conflitService = {
      getConflictContext: vi.fn(async () => ctx),
      recomputeConflits: vi.fn(async () => []),
    };

    audit = {
      writeAudit: vi.fn().mockResolvedValue({ id: 'audit-1', at: new Date() }),
    };

    service = new MoveSeanceService(prisma as any, conflitService as any, audit as any);
  });

  it('déplace une séance avec succès (revision incrémentée, occupations recréées, audit écrit)', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([]);
    prisma.seance.update.mockResolvedValue({
      ...seance,
      jour: dto.jour,
      creneauDebutId: dto.creneauDebutId,
      salleId: dto.salleId,
      statut: SeanceStatut.PLACEE,
      revision: 4,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      ...seance,
      jour: dto.jour,
      creneauDebutId: dto.creneauDebutId,
      salleId: dto.salleId,
      statut: SeanceStatut.PLACEE,
      revision: 4,
      occupations: [],
    } as any);

    const result = await service.move(seanceId, dto, '3', userGestionnaire);

    expect(result.revision).toBe(4);
    expect(result.jour).toBe(dto.jour);
    expect(result.creneauDebutId).toBe(dto.creneauDebutId);
    expect(result.salleId).toBe(dto.salleId);
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    expect(conflitService.recomputeConflits).toHaveBeenCalledWith(versionId);
  });

  it('lève 412 si l en-tête If-Match est absent', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);

    await expect(
      service.move(seanceId, dto, undefined as any, userGestionnaire),
    ).rejects.toThrow(/If-Match/);
  });

  it('lève 412 si la revision est périmée', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);

    await expect(
      service.move(seanceId, dto, '2', userGestionnaire),
    ).rejects.toThrow(/révision périmée/);
  });

  it('lève 409 si la version est PUBLIE (immutabilité)', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: VersionStatut.PUBLIE,
    });

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/IMMUTABILITY/);
  });

  it('lève 409 si un verrou actif CRENEAU est présent sur la séance', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([
      { id: 'v-1', type: 'CRENEAU', auteurId: 'auteur-1', creeLe: new Date() },
    ]);

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/verrouillée/);
  });

  it('lève 422 SEANCE_CONFLICT_BLOCKING quand un conflit bloquant est détecté', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([]);

    vi.mocked(validatePlacement).mockReturnValue([
      {
        regleCode: 'SALLE_DOUBLE_BOOKING',
        type: 'SALLE',
        severite: 'BLOQUANT',
        objetType: 'salle',
        objetId: 'salle-1',
        seanceIds: ['seance-1', 'seance-2'],
        message: 'Salle déjà occupée sur ce créneau',
        signature: 'sig-1',
      } as any,
    ]);

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/SEANCE_CONFLICT_BLOCKING/);

    expect(prisma.seance.update).not.toHaveBeenCalled();
    expect(prisma.occupation.deleteMany).not.toHaveBeenCalled();
    expect(prisma.occupation.create).not.toHaveBeenCalled();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('lève 403 si aucun bail d\'édition actif sur la version', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue(null);

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/Aucun bail d.édition actif/);
  });

  it('lève 403 si le bail est détenu par un autre utilisateur (non-admin)', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId: 'autre-utilisateur',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/détenu par un autre/);
  });

  it('lève 404 si la séance est introuvable', async () => {
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.move(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(NotFoundException);
  });

  it('autorise un administrateur à déplacer malgré un bail détenu par un autre', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId: 'autre-utilisateur',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([]);
    prisma.seance.update.mockResolvedValue({
      ...seance,
      jour: dto.jour,
      creneauDebutId: dto.creneauDebutId,
      salleId: dto.salleId,
      statut: SeanceStatut.PLACEE,
      revision: 4,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      ...seance,
      jour: dto.jour,
      creneauDebutId: dto.creneauDebutId,
      salleId: dto.salleId,
      statut: SeanceStatut.PLACEE,
      revision: 4,
      occupations: [],
    } as any);

    const result = await service.move(seanceId, dto, '3', userAdmin);

    expect(result.revision).toBe(4);
  });
});