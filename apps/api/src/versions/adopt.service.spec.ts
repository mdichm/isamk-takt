// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'adoption de génération (L4-19)
import {
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionService } from './version.service.js';

describe('VersionService.adoptGeneration (L4-19)', () => {
  let service: VersionService;
  let prisma: any;
  let conflitService: any;
  let bossMock: any;

  const versionId = 'version-1';
  const generationId = 'generation-1';
  const userId = 'user-1';
  const semestreId = 'semestre-1';

  beforeEach(async () => {
    prisma = {
      versionEdt: { findUnique: vi.fn(), update: vi.fn() },
      generation: { findUnique: vi.fn() },
      creneau: { findMany: vi.fn() },
      occupation: { deleteMany: vi.fn(), createMany: vi.fn() },
      seanceGroupe: { deleteMany: vi.fn() },
      seance: { create: vi.fn(), deleteMany: vi.fn() },
      conflit: { deleteMany: vi.fn() },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    conflitService = { recomputeConflits: vi.fn() };
    bossMock = { send: vi.fn().mockResolvedValue('job-id') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: { getPreparation: vi.fn() } },
        { provide: ConflitService, useValue: conflitService },
        { provide: 'BOSS', useValue: bossMock },
      ],
    }).compile();
    service = module.get(VersionService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adopte une génération réussie : 1.0 -> 2.0, EDITION, séances remplacées sauf verrou ACTIVITE, conflits recalculés', async () => {
    const seanceAVeiller = { id: 's-veiller', origine: 'MOTEUR', verrous: [] };
    const seanceVerrouillee = {
      id: 's-verrouillee',
      origine: 'MOTEUR',
      verrous: [{ type: 'ACTIVITE', leveLe: null }],
    };
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'BROUILLON', numero: '1.0', semestreId,
      seances: [seanceAVeiller, seanceVerrouillee],
    } as any);
    const generationSeance = {
      id: 'gs-1', affectationKey: 'INFO-101', rang: 1, nbCreneaux: 2,
      statut: 'PLACEE', enseignantId: 'ens-1', salleId: 'salle-1',
      jour: 'LUNDI', creneauDebutId: 'c-1', groupeIds: ['g-1'],
    };
    prisma.generation.findUnique.mockResolvedValue({
      id: generationId, versionId, statut: 'SUCCEEDED',
      perimetreHash: 'hash-1', seances: [generationSeance],
    } as any);
    vi.spyOn(service as any, 'getPerimetre')
      .mockResolvedValue({ perimetreHash: 'hash-1' } as any);
    prisma.creneau.findMany.mockResolvedValue([
      { id: 'c-1', jour: 'LUNDI', ordre: 1 },
      { id: 'c-2', jour: 'LUNDI', ordre: 2 },
    ] as any);
    prisma.seance.create.mockResolvedValue({
      id: 'ns-1', statut: 'PLACEE', jour: 'LUNDI', creneauDebutId: 'c-1',
      groupes: [{ groupeId: 'g-1' }],
    } as any);
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
    conflitService.recomputeConflits.mockResolvedValue(
      [{ id: 'c1' }, { id: 'c2' }] as any,
    );

    const result = await service.adoptGeneration(versionId, generationId, userId);

    expect(result).toEqual({
      versionId, numero: '2.0', statut: 'EDITION', conflitsInitiaux: 2,
    });
    expect(prisma.seance.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['s-veiller'] } },
    });
    expect(prisma.seance.create).toHaveBeenCalledTimes(1);
    expect(prisma.versionEdt.update).toHaveBeenCalledWith({
      where: { id: versionId },
      data: { statut: 'EDITION', numero: '2.0', motif: expect.any(String) },
    });
    expect(conflitService.recomputeConflits).toHaveBeenCalledWith(versionId);
  });

  it('lève 404 si la version est introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(NotFoundException);
  });

  it('lève 409 INVALID_STATE_TRANSITION si la version est PUBLIE', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'PUBLIE', numero: '1.0', semestreId, seances: [],
    } as any);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(ConflictException);
  });

  it('lève 404 si la génération est introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'BROUILLON', numero: '1.0', semestreId,
      seances: [],
    } as any);
    prisma.generation.findUnique.mockResolvedValue(null);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(NotFoundException);
  });

  it('lève 422 si la génération ne porte pas sur cette version', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'BROUILLON', numero: '1.0', semestreId,
      seances: [],
    } as any);
    prisma.generation.findUnique.mockResolvedValue({
      id: generationId, versionId: 'autre-version', statut: 'SUCCEEDED',
      perimetreHash: 'hash-1', seances: [],
    } as any);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(UnprocessableEntityException);
  });

  it('lève 422 si la génération n est pas dans un etat adopté', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'BROUILLON', numero: '1.0', semestreId,
      seances: [],
    } as any);
    prisma.generation.findUnique.mockResolvedValue({
      id: generationId, versionId, statut: 'FAILED', perimetreHash: 'hash-1',
      seances: [],
    } as any);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(UnprocessableEntityException);
  });

  it('lève 422 si les snapshots de la version ont changé depuis la génération', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId, statut: 'BROUILLON', numero: '1.0', semestreId,
      seances: [],
    } as any);
    prisma.generation.findUnique.mockResolvedValue({
      id: generationId, versionId, statut: 'SUCCEEDED',
      perimetreHash: 'hash-1', seances: [],
    } as any);
    vi.spyOn(service as any, 'getPerimetre')
      .mockResolvedValue({ perimetreHash: 'hash-2' } as any);
    await expect(service.adoptGeneration(versionId, generationId, userId))
      .rejects.toThrow(UnprocessableEntityException);
  });
});