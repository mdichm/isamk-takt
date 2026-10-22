// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de changement d'enseignant (L3-22)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException, ConflictException, HttpStatus } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { AuditService } from '../audit/audit.service.js';
import { RoleCode, VersionStatut, VerrouType } from '@takt/db';
import { ChangeEnseignantService } from './change-enseignant.service.js';
import { ChangeEnseignantDto } from './dto/change-enseignant.dto.js';

describe('ChangeEnseignantService', () => {
  let service: ChangeEnseignantService;
  let prisma: any;
  let conflitService: any;
  let audit: any;

  const seanceId = 'seance-1';
  const versionId = 'version-1';
  const userId = 'user-1';

  const dto: ChangeEnseignantDto = {
    enseignantId: 'enseignant-2',
  };

  const seance = {
    id: seanceId,
    versionId,
    semestreId: 'semestre-1',
    enseignantId: 'enseignant-1',
    salleId: 'salle-0',
    jour: 'LUNDI',
    creneauDebutId: 'creneau-1',
    nbCreneaux: 1,
    statut: 'PLACEE',
    tag: null,
    affectationKey: 'groupe-1:module-1:type-1:enseignant-1',
    revision: 3,
    seanceGroupes: [{ groupeId: 'groupe-1' }],
  };

  const ctx: any = {
    versionId,
    grille: {
      consecutifs: vi.fn(() => ['LUNDI|creneau-1']),
    },
    snapshot: {
      get: vi.fn(() => ({
        enseignantsAutorises: ['enseignant-1', 'enseignant-2'],
      })),
    },
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

    service = new ChangeEnseignantService(prisma as any, conflitService as any, audit as any);
  });

  it('change l\'enseignant d\'une séance avec succès (revision incrémentée, occupations mises à jour, audit écrit)', async () => {
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
      enseignantId: dto.enseignantId,
      revision: 4,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      ...seance,
      enseignantId: dto.enseignantId,
      revision: 4,
      occupations: [],
    } as any);

    const result = await service.changeEnseignant(seanceId, dto, '3', userGestionnaire);

    expect(result.enseignantId).toBe(dto.enseignantId);
    expect(result.revision).toBe(4);
    expect(prisma.seance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: seanceId },
        data: { enseignantId: dto.enseignantId, revision: { increment: 1 } },
      }),
    );
    expect(prisma.occupation.deleteMany).toHaveBeenCalledWith({
      where: { seanceId, ressourceType: 'ENSEIGNANT' },
    });
    expect(prisma.occupation.create).toHaveBeenCalledWith({
      data: {
        versionId,
        seanceId,
        jour: 'LUNDI',
        creneauId: 'creneau-1',
        ressourceType: 'ENSEIGNANT',
        ressourceId: dto.enseignantId,
      },
    });
    expect(audit.writeAudit).toHaveBeenCalled();
    expect(conflitService.recomputeConflits).toHaveBeenCalledWith(versionId);
  });

  it('lève 412 si l\'en-tête If-Match est absent ou la révision est périmée', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);

    await expect(
      service.changeEnseignant(seanceId, dto, '2', userGestionnaire),
    ).rejects.toMatchObject({
      status: HttpStatus.PRECONDITION_FAILED,
      response: { errorCode: 'PRECONDITION_FAILED' },
    });

    await expect(
      service.changeEnseignant(seanceId, dto, '', userGestionnaire),
    ).rejects.toMatchObject({
      status: HttpStatus.PRECONDITION_FAILED,
      response: { errorCode: 'PRECONDITION_FAILED' },
    });
  });

  it('lève 403 si aucun bail d\'édition actif sur la version', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue(null);

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
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
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/détenu par un autre/);
  });

  it('autorise un administrateur à changer l\'enseignant malgré un bail détenu par un autre', async () => {
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
      enseignantId: dto.enseignantId,
      revision: 4,
    } as any);
    prisma.seance.findUnique.mockResolvedValue({
      ...seance,
      enseignantId: dto.enseignantId,
      revision: 4,
      occupations: [],
    } as any);

    const result = await service.changeEnseignant(seanceId, dto, '3', userAdmin);

    expect(result.enseignantId).toBe(dto.enseignantId);
    expect(result.revision).toBe(4);
  });

  it('lève 409 si un verrou enseignant est actif sur la séance', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([{
      id: 'verrou-1',
      seanceId,
      type: VerrouType.ENSEIGNANT,
      leveLe: null,
      auteurId: 'auteur-1',
      creeLe: new Date(),
    }]);

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/verrouillée/);
  });

  it('lève 409 si un verrou activité est actif sur la séance', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([{
      id: 'verrou-1',
      seanceId,
      type: VerrouType.ACTIVITE,
      leveLe: null,
      auteurId: 'auteur-1',
      creeLe: new Date(),
    }]);

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(/verrouillée/);
  });

  it('lève 422 TEACHER_NOT_ASSIGNED si l\'enseignant n\'est pas autorisé pour un groupe', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.BROUILLON });
    prisma.editLock.findUnique.mockResolvedValue({
      id: 'lock-1',
      versionId,
      userId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    prisma.verrouSeance.findMany.mockResolvedValue([]);
    vi.mocked(ctx.snapshot.get).mockReturnValueOnce({
      enseignantsAutorises: ['enseignant-1'],
    });

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      response: { code: 'TEACHER_NOT_ASSIGNED' },
    });

    expect(prisma.seance.update).not.toHaveBeenCalled();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('lève 404 si la séance est introuvable', async () => {
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(NotFoundException);
  });

  it('lève 409 si la version est publiée ou archivée', async () => {
    prisma.seance.findFirst.mockResolvedValue(seance as any);
    prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId, statut: VersionStatut.PUBLIE });

    await expect(
      service.changeEnseignant(seanceId, dto, '3', userGestionnaire),
    ).rejects.toThrow(ConflictException);
  });
});