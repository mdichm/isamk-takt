// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'analyse d'impact par département (L5-03)
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionService } from './version.service.js';

// ============================================
// VersionService.getImpact (L5-03)
// ============================================

describe('VersionService.getImpact', () => {
  let service: VersionService;
  let prisma: any;

  const versionId = 'version-1';
  const semestreId = 'semestre-1';
  const dept1Id = 'dept-1';
  const dept2Id = 'dept-2';

  const makeVersion = (overrides: Record<string, unknown> = {}) => ({
    id: versionId,
    semestreId,
    numero: '1.0',
    statut: 'EDITION',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    ...overrides,
  });

  const makeGroupe = (departementId: string) => ({
    id: 'groupe-' + departementId,
    niveau: {
      formation: {
        departement: { id: departementId, code: 'INFO', libelle: 'Informatique' },
      },
    },
  });

  beforeEach(async () => {
    prisma = {
      versionEdt: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      groupe: { findMany: vi.fn() },
      seance: { findMany: vi.fn() },
      enseignant: { findMany: vi.fn() },
      repartition: { findMany: vi.fn() },
      snapshot: { findMany: vi.fn() },
      impactDepartement: { upsert: vi.fn() },
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

  it('rend tous les départements IMPACTE quand il ny a pas de version parente', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion());
    prisma.groupe.findMany.mockResolvedValue([
      makeGroupe(dept1Id),
      { ...makeGroupe(dept2Id), niveau: { formation: { departement: { id: dept2Id, code: 'MATH', libelle: 'Maths' } } } },
    ]);
    prisma.seance.findMany.mockResolvedValue([]);
    prisma.versionEdt.findFirst.mockResolvedValue(null);
    prisma.repartition.findMany.mockResolvedValue([]);

    const result = await service.getImpact(versionId);

    expect(result.versionId).toBe(versionId);
    expect(result.resume.impactes).toBe(2);
    expect(result.resume.nonImpactes).toBe(0);
    expect(result.resume.reportees).toBe(0);
    for (const d of result.departements) {
      expect(d.statut).toBe('IMPACTE');
      expect(d.raison).toBe('PREMIERE_VERSION');
      expect(d.reportee).toBe(false);
    }
  });

  it('rapporte les approbations des départements non impactés quand une version parente est approuvée', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion({ numero: '2.0' }));
    prisma.groupe.findMany.mockResolvedValue([
      makeGroupe(dept1Id),
      { ...makeGroupe(dept2Id), niveau: { formation: { departement: { id: dept2Id, code: 'MATH', libelle: 'Maths' } } } },
    ]);
    prisma.seance.findMany.mockResolvedValue([]);
    prisma.versionEdt.findFirst.mockResolvedValue({
      id: 'version-parente', statut: 'PUBLIE', numero: '1.0',
    });
    prisma.repartition.findMany.mockResolvedValue([]);

    const result = await service.getImpact(versionId);

    expect(result.resume.impactes).toBe(0);
    expect(result.resume.nonImpactes).toBe(2);
    expect(result.resume.reportees).toBe(2);
    for (const d of result.departements) {
      expect(d.statut).toBe('NON_IMPACTE');
      expect(d.raison).toBe('AUCUN_CHANGEMENT');
      expect(d.reportee).toBe(true);
      expect(d.cycleSource).toBe('version-parente');
    }
  });

  it('marque un département IMPACTE (ENSEIGNANT_PARTAGE) quand un de ses enseignants est sur une séance modifiée', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion({ numero: '2.0' }));
    prisma.groupe.findMany.mockResolvedValueOnce([
      makeGroupe(dept1Id),
      { ...makeGroupe(dept2Id), niveau: { formation: { departement: { id: dept2Id, code: 'MATH', libelle: 'Maths' } } } },
    ]);
    prisma.seance.findMany.mockResolvedValue([
      { id: 's-1', enseignantId: 'ens-dept2', groupes: [{ groupeId: 'groupe-' + dept1Id }] },
    ]);
    prisma.groupe.findMany.mockResolvedValue([
      { id: 'groupe-' + dept1Id, niveau: { formation: { departementId: dept1Id } } },
    ]);
    prisma.enseignant.findMany.mockResolvedValue([
      { id: 'ens-dept2', departementId: dept2Id },
    ]);
    prisma.versionEdt.findFirst.mockResolvedValue({
      id: 'version-parente', statut: 'PUBLIE', numero: '1.0',
    });
    prisma.repartition.findMany.mockResolvedValue([]);

    const result = await service.getImpact(versionId);

    const d1 = result.departements.find((d) => d.departementId === dept1Id);
    const d2 = result.departements.find((d) => d.departementId === dept2Id);
    expect(d1!.statut).toBe('IMPACTE');
    expect(d1!.raison).toBe('SEANCES_MODIFIEES');
    expect(d2!.statut).toBe('IMPACTE');
    expect(d2!.raison).toBe('ENSEIGNANT_PARTAGE');
    expect(result.resume.impactes).toBe(2);
  });

  it('ne marque pas un département impacté si seule une salle est modifiée', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion({ numero: '2.0' }));
    prisma.groupe.findMany.mockResolvedValue([makeGroupe(dept1Id)]);
    prisma.seance.findMany.mockResolvedValue([
      { id: 's-1', enseignantId: null, groupes: [] },
    ]);
    prisma.versionEdt.findFirst.mockResolvedValue({
      id: 'version-parente', statut: 'PUBLIE', numero: '1.0',
    });
    prisma.repartition.findMany.mockResolvedValue([]);

    const result = await service.getImpact(versionId);

    expect(result.departements[0].statut).toBe('NON_IMPACTE');
    expect(result.departements[0].raison).toBe('AUCUN_CHANGEMENT');
    expect(result.resume.impactes).toBe(0);
  });

  it('marque un département IMPACTE (SNAPSHOT_MODIFIE) quand son snapshot est plus récent que la version', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(makeVersion({ numero: '2.0' }));
    prisma.groupe.findMany.mockResolvedValue([makeGroupe(dept1Id)]);
    prisma.seance.findMany.mockResolvedValue([]);
    prisma.versionEdt.findFirst.mockResolvedValue({
      id: 'version-parente', statut: 'PUBLIE', numero: '1.0',
    });
    const maintenant = new Date('2026-01-11T10:00:00Z');
    prisma.repartition.findMany.mockResolvedValue([
      { id: 'rep-1', departementId: dept1Id },
    ]);
    prisma.snapshot.findMany.mockResolvedValue([
      { repartitionId: 'rep-1', valideLe: maintenant },
    ]);

    const result = await service.getImpact(versionId);

    expect(result.departements[0].statut).toBe('IMPACTE');
    expect(result.departements[0].raison).toBe('SNAPSHOT_MODIFIE');
    expect(result.resume.impactes).toBe(1);
  });

  it('lève une NotFoundException si la version est introuvable', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);
    await expect(service.getImpact('version-inconnue')).rejects.toBeInstanceOf(NotFoundException);
  });
});