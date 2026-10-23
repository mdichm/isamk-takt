// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de suggestions (L3-25)
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { RoleCode } from '@takt/db';
import { validatePlacement, computeSoftDelta } from '@takt/conflict-engine';
import { SuggestionsService } from './suggestions.service.js';
import { SuggestionsQueryDto } from './dto/suggestions.dto.js';

vi.mock('@takt/conflict-engine', async (importActual) => {
  const actual = await importActual<typeof import('@takt/conflict-engine')>();
  return {
    ...actual,
    validatePlacement: vi.fn(),
    computeSoftDelta: vi.fn(),
  };
});

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let prisma: any;
  let conflitService: any;

  const seanceId = 'seance-1';
  const versionId = 'version-1';

  const dto: SuggestionsQueryDto = {};

  const ctx: any = {
    versionId,
    occ: { get: vi.fn(() => undefined) },
    indispo: { has: vi.fn(() => false) },
    reqs: new Map(),
    snapshot: { get: vi.fn(() => undefined) },
    verrous: { has: vi.fn(() => false) },
    salles: new Map([
      ['salle-1', { id: 'salle-1', actif: true }],
      ['salle-2', { id: 'salle-2', actif: true }],
    ]),
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux: new Map([
      ['creneau-1', { id: 'creneau-1', jour: 'LUNDI', ordre: 1, estPause: false }],
      ['creneau-2', { id: 'creneau-2', jour: 'LUNDI', ordre: 2, estPause: false }],
      ['creneau-3', { id: 'creneau-3', jour: 'MARDI', ordre: 1, estPause: false }],
    ]),
    groupeEffectifs: new Map(),
    covoiturageGroupes: new Map(),
    groupeClosure: {},
    grille: {
      consecutifs: vi.fn((jour, creneauDebut, nb) => {
        if (jour === 'LUNDI' && creneauDebut === 'creneau-1' && nb === 1)
          return ['LUNDI|1'];
        if (jour === 'LUNDI' && creneauDebut === 'creneau-2' && nb === 1)
          return ['LUNDI|2'];
        if (jour === 'MARDI' && creneauDebut === 'creneau-3' && nb === 1)
          return ['MARDI|1'];
        return null;
      }),
    },
  };

  const userGestionnaire = { id: 'user-1', role: RoleCode.GESTIONNAIRE };

  beforeEach(async () => {
    vi.mocked(validatePlacement).mockReturnValue([]);
    vi.mocked(computeSoftDelta).mockReturnValue({
      delta: 0,
      avant: { score: 50, details: [] },
      apres: { score: 50, details: [] },
      details: [],
    });

    prisma = {
      seance: { findFirst: vi.fn() },
      versionEdt: { findUnique: vi.fn() },
    };

    conflitService = {
      getConflictContext: vi.fn(async () => ctx),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConflitService, useValue: conflitService },
      ],
    }).compile();

    service = module.get(SuggestionsService);
  });

  it('retourne des suggestions sans conflit bloquant', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-1',
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      nbCreneaux: 1,
      statut: 'PLACEE',
      tag: null,
      seanceGroupes: [{ groupeId: 'groupe-1' }],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const result = await service.suggestions(seanceId, dto, userGestionnaire);

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.dureeMs).toBeGreaterThanOrEqual(0);
    for (const s of result.suggestions) {
      expect(
        s.jour === 'LUNDI' &&
          s.creneauDebutId === 'creneau-1' &&
          s.salleId === 'salle-1',
      ).toBe(false);
    }
  });

  it('rejette les candidats avec conflit bloquant', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-1',
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      nbCreneaux: 1,
      statut: 'PLACEE',
      tag: null,
      seanceGroupes: [{ groupeId: 'groupe-1' }],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    vi.mocked(validatePlacement).mockReturnValue([
      {
        regleCode: 'ENSEIGNANT_DOUBLE_BOOKING',
        type: 'ENSEIGNANT',
        severite: 'BLOQUANT',
        objetType: 'enseignant',
        objetId: 'enseignant-1',
        seanceIds: [seanceId],
        message: 'Enseignant déjà occupé',
        signature: 'sig-bloquant',
      } as any,
    ]);

    const result = await service.suggestions(seanceId, dto, userGestionnaire);

    expect(result.suggestions).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('lève NotFoundException quand la séance est introuvable', async () => {
    prisma.seance.findFirst.mockResolvedValue(null);

    await expect(
      service.suggestions(seanceId, dto, userGestionnaire),
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
      seanceGroupes: [],
    } as any);

    await expect(
      service.suggestions(seanceId, dto, userGestionnaire),
    ).rejects.toThrow(NotFoundException);
  });

  it('limite le nombre de suggestions à 20 maximum', async () => {
    prisma.seance.findFirst.mockResolvedValue({
      id: seanceId,
      versionId,
      enseignantId: 'enseignant-1',
      salleId: 'salle-1',
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      nbCreneaux: 1,
      statut: 'PLACEE',
      tag: null,
      seanceGroupes: [{ groupeId: 'groupe-1' }],
    } as any);
    conflitService.getConflictContext.mockResolvedValue(ctx as any);

    const result = await service.suggestions(
      seanceId,
      { ...dto, limit: 5 },
      userGestionnaire,
    );

    expect(result.suggestions.length).toBeLessThanOrEqual(5);
    expect(result.total).toBeLessThanOrEqual(5);
  });
});