// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de version (L3-09)
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { VersionService } from './version.service.js';

// ============================================
// VersionService (L3-09)
// ============================================

describe('VersionService', () => {
  let service: VersionService;
  let prisma: any;

  const semestreId = 'semestre-1';
  const dept1Id = 'dept-1';
  const dept2Id = 'dept-2';
  const snapshot1Id = 'snapshot-1';
  const snapshot2Id = 'snapshot-2';

  beforeEach(async () => {
    prisma = {
      semestre: { findUnique: vi.fn() },
      departement: { findMany: vi.fn() },
      repartition: { findFirst: vi.fn() },
      snapshot: { findFirst: vi.fn() },
      versionEdt: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
      versionSnapshot: { createMany: vi.fn() },
      snapshotAffectation: { findMany: vi.fn() },
      seance: { create: vi.fn(), findMany: vi.fn() },
      $transaction: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(VersionService);
  });

  it('crée une version 1.0 avec statut BROUILLON et une séance par affectation', async () => {
    prisma.semestre.findUnique.mockResolvedValue({
      id: semestreId,
      anneeId: 'annee-1',
    } as any);

    prisma.departement.findMany.mockResolvedValue([
      { id: dept1Id, code: 'INFO' },
      { id: dept2Id, code: 'MATH' },
    ] as any);

    prisma.repartition.findFirst
      .mockResolvedValueOnce({ id: 'rep-1' } as any)
      .mockResolvedValueOnce({ id: 'rep-2' } as any);

    prisma.snapshot.findFirst
      .mockResolvedValueOnce({ id: snapshot1Id, tag: 'v1.0' } as any)
      .mockResolvedValueOnce({ id: snapshot2Id, tag: 'v1.0' } as any);

    prisma.versionEdt.findFirst.mockResolvedValue(null);

    prisma.snapshotAffectation.findMany
      .mockResolvedValueOnce([
        {
          id: 'aff-1',
          snapshotId: snapshot1Id,
          enseignantId: 'ens-1',
          groupeId: 'groupe-1',
          moduleId: 'module-1',
          typeEnseignementId: 'type-1',
          activityTagId: null,
          dureeMinutes: 90,
          seancesParSemaine: 1,
          estCmCommun: false,
        },
      ])
      .mockResolvedValueOnce([]);

    prisma.versionEdt.create.mockResolvedValue({
      id: 'version-1',
      semestreId,
      numero: '1.0',
      statut: 'BROUILLON',
      motif: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        ...prisma,
        versionEdt: { create: prisma.versionEdt.create },
        versionSnapshot: { createMany: prisma.versionSnapshot.createMany },
        snapshotAffectation: { findMany: prisma.snapshotAffectation.findMany },
        seance: { create: prisma.seance.create },
      };
      return cb(tx);
    });

    const result = await service.createVersion({ semestreId }, 'user-1');

    expect(result.numero).toBe('1.0');
    expect(result.statut).toBe('BROUILLON');
    expect(prisma.versionEdt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          semestreId,
          numero: '1.0',
          statut: 'BROUILLON',
        }),
      }),
    );
    expect(prisma.seance.create).toHaveBeenCalledTimes(1);
    const seanceCall = prisma.seance.create.mock.calls[0][0].data;
    expect(seanceCall.affectationKey).toContain('groupe-1');
    expect(seanceCall.rang).toBe(1);
    expect(seanceCall.tag).toBe('v1.0');
  });
  it('retourne 422 si un département n\'a pas de snapshot valide', async () => {
    prisma.semestre.findUnique.mockResolvedValue({
      id: semestreId,
      anneeId: 'annee-1',
    } as any);

    prisma.departement.findMany.mockResolvedValue([
      { id: dept1Id, code: 'INFO' },
      { id: dept2Id, code: 'MATH' },
    ] as any);

    prisma.repartition.findFirst
      .mockResolvedValueOnce({ id: 'rep-1' } as any)
      .mockResolvedValueOnce(null as any);

    await expect(
      service.createVersion({ semestreId }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('retourne 409 si une version de travail existe déjà', async () => {
    prisma.semestre.findUnique.mockResolvedValue({
      id: semestreId,
      anneeId: 'annee-1',
    } as any);

    prisma.departement.findMany.mockResolvedValue([
      { id: dept1Id, code: 'INFO' },
    ] as any);

    prisma.repartition.findFirst.mockResolvedValue({ id: 'rep-1' } as any);
    prisma.snapshot.findFirst.mockResolvedValue({
      id: snapshot1Id,
      tag: 'v1.0',
    } as any);

    prisma.versionEdt.findFirst.mockResolvedValue({
      id: 'version-existante',
      numero: '1.0',
      statut: 'BROUILLON',
    } as any);

    await expect(
      service.createVersion({ semestreId }, 'user-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('lève NotFoundException si le semestre n\'existe pas', async () => {
    prisma.semestre.findUnique.mockResolvedValue(null);

    await expect(
      service.createVersion({ semestreId: 'inexistant' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
  // ============================================
  // getCompletude (L3-30)
  // ============================================

  it('retourne la couverture par affectation avec attendu, placé et écart', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({ id: 'version-1' } as any);
    prisma.seance.findMany.mockResolvedValue([
      { affectationKey: 'g-1:m-1:t-1:e-1', statut: 'PLACEE' },
      { affectationKey: 'g-1:m-1:t-1:e-1', statut: 'NON_PLACEE' },
      { affectationKey: 'g-2:m-1:t-1:e-1', statut: 'PLACEE' },
    ] as any);

    const result = await service.getCompletude('version-1');

    expect(result.attenduTotal).toBe(3);
    expect(result.placeTotal).toBe(2);
    expect(result.ecartTotal).toBe(1);
    expect(result.couvertureTotale).toBe(67);
    expect(result.couvertureExacte).toBe(false);
    expect(result.parAffectation).toHaveLength(2);
    const a1 = result.parAffectation.find((a) => a.affectationKey === 'g-1:m-1:t-1:e-1')!;
    expect(a1.attendu).toBe(2);
    expect(a1.place).toBe(1);
    expect(a1.ecart).toBe(1);
    const a2 = result.parAffectation.find((a) => a.affectationKey === 'g-2:m-1:t-1:e-1')!;
    expect(a2.attendu).toBe(1);
    expect(a2.place).toBe(1);
    expect(a2.ecart).toBe(0);
  });

  it('retourne couverture exacte quand toutes les séances sont placées', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({ id: 'version-1' } as any);
    prisma.seance.findMany.mockResolvedValue([
      { affectationKey: 'g-1:m-1:t-1:e-1', statut: 'PLACEE' },
    ] as any);

    const result = await service.getCompletude('version-1');

    expect(result.couvertureTotale).toBe(100);
    expect(result.couvertureExacte).toBe(true);
    expect(result.ecartTotal).toBe(0);
  });

  it('retourne couverture 100 quand il n\'y a pas de séance', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue({ id: 'version-1' } as any);
    prisma.seance.findMany.mockResolvedValue([] as any);

    const result = await service.getCompletude('version-1');

    expect(result.attenduTotal).toBe(0);
    expect(result.couvertureTotale).toBe(100);
    expect(result.couvertureExacte).toBe(true);
    expect(result.parAffectation).toEqual([]);
  });

  it('lève NotFoundException si la version n\'existe pas', async () => {
    prisma.versionEdt.findUnique.mockResolvedValue(null);
    await expect(service.getCompletude('inconnu')).rejects.toThrow(NotFoundException);
  });
});
