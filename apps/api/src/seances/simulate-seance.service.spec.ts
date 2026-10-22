// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de simulation de placement (L3-21)
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { RoleCode } from '@takt/db';
import { validatePlacement } from '@takt/conflict-engine';
import { SimulateSeanceService } from './simulate-seance.service.js';
import { SimulatePlacementDto } from './dto/simulate-placement.dto.js';

vi.mock('@takt/conflict-engine', async (importActual) => {
  const actual = await importActual<typeof import('@takt/conflict-engine')>();
  return {
    ...actual,
    validatePlacement: vi.fn(),
  };
});

// ============================================
// SimulateSeanceService (L3-21)
// ============================================

describe('SimulateSeanceService', () => {
  let service: SimulateSeanceService;
  let prisma: any;
  let conflitService: any;

  const seanceId = 'seance-1';
  const versionId = 'version-1';

  const dto: SimulatePlacementDto = {
    jour: 'LUNDI',
    creneauDebutId: 'creneau-1',
    salleId: 'salle-1',
  };

  const ctx: any = {
    versionId,
    occ: { get: vi.fn(() => undefined) },
    indispo: { has: vi.fn(() => false) },
    reqs: new Map(),
    snapshot: { get: vi.fn(() => undefined) },
    verrous: { has: vi.fn(() => false) },
    salles: new Map(),
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux: new Map(),
    groupeEffectifs: new Map(),
    covoiturageGroupes: new Map(),
    groupeClosure: {},
    grille: { consecutifs: vi.fn(() => null) },
  };

  const userGestionnaire = { id: 'user-1', role: RoleCode.GESTIONNAIRE };

  beforeEach(async () => {
    vi.mocked(validatePlacement).mockReturnValue([]);

    prisma = {
      seance: { findFirst: vi.fn() },
      versionEdt: { findUnique: vi.fn() },
    };

    conflitService = {
      getConflictContext: vi.fn(async () => ctx),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulateSeanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConflitService, useValue: conflitService },
      ],
    }).compile();

    service = module.get(SimulateSeanceService);
  });

  it('retourne placementValide: true quand aucun conflit bloquant', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-0',
      statut: 'PLACEE',
      nbCreneaux: 1,
      groupes: [{ groupeId: 'groupe-1' }],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const result = await service.simulate(seanceId, dto, userGestionnaire);

    expect(result.placementValide).toBe(true);
    expect(result.conflitsBloquants).toEqual([]);
    expect(result.conflitsAvertissements).toEqual([]);
    expect(result.impacts).toEqual({
      groupes: ['groupe-1'],
      enseignant: 'enseignant-1',
      salle: 'salle-0',
      verrous: [],
    });
    expect(result.dureeMs).toBeGreaterThanOrEqual(0);
    expect(conflitService.getConflictContext).toHaveBeenCalledWith(versionId);
  });

  it('retourne placementValide: false et classe les conflits bloquants', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-0',
      statut: 'PLACEE',
      nbCreneaux: 1,
      groupes: [{ groupeId: 'groupe-1' }],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const conflitBloquant = {
      regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
      type: 'ENSEIGNANT',
      severite: 'BLOQUANT',
      message: 'Enseignant déjà occupé',
      signature: 'sig-1',
      seanceIds: ['seance-2'],
    } as any;
    const conflitAvertissement = {
      regleCode: 'SALLE_SOUHAITE_MANQUANT',
      type: 'SALLE',
      severite: 'AVERTISSEMENT',
      message: 'Équipement souhaité manquant',
      signature: 'sig-2',
      seanceIds: [],
    } as any;

    vi.mocked(validatePlacement).mockReturnValue([
      conflitBloquant,
      conflitAvertissement,
    ]);

    const result = await service.simulate(seanceId, dto, userGestionnaire);

    expect(result.placementValide).toBe(false);
    expect(result.conflitsBloquants).toHaveLength(1);
    expect(result.conflitsBloquants[0].regleCode).toBe(
      'ENSEIGNANT_DOUBLE_BOOKING',
    );
    expect(result.conflitsAvertissements).toHaveLength(1);
    expect(result.impacts.verrous).toEqual([]);
  });

  it('lève NotFoundException quand la séance est introuvable', async () => {
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.simulate(seanceId, dto, userGestionnaire),
    ).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException quand la séance na pas de version', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId: null,
      enseignantId: null,
      salleId: null,
      statut: 'NON_PLACEE',
      nbCreneaux: 1,
      groupes: [],
    } as any);

    await expect(
      service.simulate(seanceId, dto, userGestionnaire),
    ).rejects.toThrow(NotFoundException);
  });

  it('autorise la simulation pour un GESTIONNAIRE sur version BROUILLON', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: null,
      salleId: null,
      statut: 'NON_PLACEE',
      nbCreneaux: 1,
      groupes: [],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const result = await service.simulate(seanceId, dto, userGestionnaire);

    expect(result.placementValide).toBe(true);
  });

  it('lève NotFoundException pour un DIRECTION sur version BROUILLON', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: null,
      salleId: null,
      statut: 'NON_PLACEE',
      nbCreneaux: 1,
      groupes: [],
    } as any);
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'BROUILLON',
    } as any);

    const userDirection = { id: 'user-2', role: RoleCode.DIRECTION };
    await expect(
      service.simulate(seanceId, dto, userDirection),
    ).rejects.toThrow(NotFoundException);
  });

  it('autorise la simulation pour un DIRECTION sur version PUBLIE', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-0',
      statut: 'PLACEE',
      nbCreneaux: 1,
      groupes: [{ groupeId: 'groupe-1' }],
    } as any);
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionId,
      statut: 'PUBLIE',
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const userDirection = { id: 'user-2', role: RoleCode.DIRECTION };
    const result = await service.simulate(seanceId, dto, userDirection);

    expect(result.placementValide).toBe(true);
    expect(prisma.versionEdt.findUnique).toHaveBeenCalledWith({
      where: { id: versionId },
      select: { statut: true },
    });
  });
});