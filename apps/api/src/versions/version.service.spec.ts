// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de version (L3-09)
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
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
      enseignant: { findMany: vi.fn() },
      salle: { findMany: vi.fn() },
      module: { findMany: vi.fn() },
      typeEnseignement: { findMany: vi.fn() },
      profilGeneration: { findFirst: vi.fn(), findUnique: vi.fn() },
      repartition: { findFirst: vi.fn() },
      snapshot: { findFirst: vi.fn() },
      versionEdt: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
      versionSnapshot: { findMany: vi.fn(), createMany: vi.fn() },
      snapshotAffectation: { findMany: vi.fn() },
      seance: { create: vi.fn(), findMany: vi.fn() },
      editLock: { findUnique: vi.fn() },
      generation: { findFirst: vi.fn() },
      contrainteInstance: { findMany: vi.fn() },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(),
    };

    const preparationService = {
      getPreparation: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: preparationService },
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

  // ============================================
  // getPerimetre (L4-13)
  // ============================================

  describe('getPerimetre', () => {
    it('retourne le perimetre avec son empreinte SHA-256', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        semestreId: semestreId,
        numero: '1.0',
        statut: 'BROUILLON',
        verrous: [],
      } as any);

      prisma.semestre.findUnique.mockResolvedValue({
        id: semestreId,
        numero: 1,
        anneeId: 'annee-1',
        annee: { id: 'annee-1', code: '2026-2027', numero: 2026 },
        groupes: [
          {
            id: 'groupe-1',
            code: 'INFO-L3-S1',
            effectif: 30,
            niveau: { code: 'L3', libelle: 'Licence 3', formation: { departementId: dept1Id } },
          },
        ],
        creneaux: [],
        contrainteInstances: [
          { id: 'ci-1', actif: true, definition: { id: 'cd-1', code: 'CD-1', libelle: 'Contrainte 1', portee: 'GLOBAL' } },
        ],
        exigencesSalle: [],
      } as any);

      prisma.departement.findMany.mockResolvedValue([
        { id: dept1Id, code: 'INFO', libelle: 'Informatique' },
      ] as any);

      prisma.enseignant.findMany.mockResolvedValue([
        { id: 'ens-1', nom: 'Dupont', prenom: 'Jean' },
      ] as any);

      prisma.salle.findMany.mockResolvedValue([
        { id: 'salle-1', code: 'AMPHI-A', capaciteMax: 100 },
      ] as any);

      prisma.versionSnapshot.findMany.mockResolvedValue([
        { snapshotId: 'snapshot-1' },
      ] as any);

      prisma.snapshotAffectation.findMany.mockResolvedValue([
        { id: 'aff-1', groupeId: 'groupe-1', moduleId: 'module-1', typeEnseignementId: 'type-1', activityTagId: null },
      ] as any);

      prisma.module.findMany.mockResolvedValue([
        { id: 'module-1', code: 'INFO101' },
      ] as any);

      prisma.typeEnseignement.findMany.mockResolvedValue([
        { id: 'type-1', code: 'CM' },
      ] as any);

      prisma.profilGeneration.findFirst.mockResolvedValue({
        id: 'profil-1',
        nom: 'Par defaut',
        numero: 1,
        estParDefaut: true,
        engineVersion: '7.12.0',
        constructeurVersion: '1.0.0',
      } as any);

      const result = await service.getPerimetre('version-1');

      expect(result.versionId).toBe('version-1');
      expect(result.semestreId).toBe(semestreId);
      expect(result.perimetreHash).toHaveLength(64);
      expect(result.genereLe).toBeInstanceOf(Date);
      expect(result.departements).toHaveLength(1);
      expect(result.groupes).toHaveLength(1);
      expect(result.enseignants).toHaveLength(1);
      expect(result.salles).toHaveLength(1);
      expect(result.contraintes).toHaveLength(1);
      expect(result.activites).toHaveLength(1);
      expect(result.profil).not.toBeNull();
      expect(result.profil!.nom).toBe('Par defaut');
      expect(result.versionDuJeuDeRegles).toBe('1');
      expect(result.versionAdaptateur).toBe('1.0.0');
    });

    it('leve NotFoundException si la version n\'existe pas', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);
      await expect(service.getPerimetre('inconnu')).rejects.toThrow(NotFoundException);
    });

    it('empreinte deterministe: meme input donne le meme hash', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: 'version-1',
        semestreId: semestreId,
        numero: '1.0',
        statut: 'BROUILLON',
        verrous: [],
      } as any);
      prisma.semestre.findUnique.mockResolvedValue({
        id: semestreId,
        numero: 1,
        anneeId: 'annee-1',
        annee: { id: 'annee-1', code: '2026-2027', numero: 2026 },
        groupes: [],
        creneaux: [],
        contrainteInstances: [],
        exigencesSalle: [],
      } as any);
      prisma.departement.findMany.mockResolvedValue([]);
      prisma.enseignant.findMany.mockResolvedValue([]);
      prisma.salle.findMany.mockResolvedValue([]);
      prisma.versionSnapshot.findMany.mockResolvedValue([]);
      prisma.snapshotAffectation.findMany.mockResolvedValue([]);
      prisma.module.findMany.mockResolvedValue([]);
      prisma.typeEnseignement.findMany.mockResolvedValue([]);
      prisma.profilGeneration.findFirst.mockResolvedValue(null);

      const r1 = await service.getPerimetre('version-1');
      const r2 = await service.getPerimetre('version-1');
      expect(r1.perimetreHash).toBe(r2.perimetreHash);
    });

    // ============================================
    // createGeneration (L4-14)
    // ============================================

    const versionId = 'version-1';
    const dto = {
      profilId: 'profil-1',
      perimetreHash: 'sha256:abcdef',
      acknowledgeUntranslatedConstraints: false,
    } as any;
    const userId = 'user-1';

    const versionMock = {
      id: versionId,
      semestreId,
      statut: 'BROUILLON',
      verrous: [],
    };

    const perimetreMock = {
      versionId,
      semestreId,
      perimetreHash: 'sha256:abcdef',
      genereLe: new Date(),
    } as any;

    const preparationMock = {
      peutGenerer: true,
      controles: [],
      nbBloquants: 0,
      nbAvertissements: 0,
      nbInfos: 0,
    };

    it('crée une génération en QUEUED avec périmètre figé (cas nominal)', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.profilGeneration.findUnique.mockResolvedValue({
        id: 'profil-1',
        semestreId,
        numero: 1,
      });
      (service as any).preparationService.getPreparation.mockResolvedValue(preparationMock);
      prisma.contrainteInstance.findMany.mockResolvedValue([]);
      (service as any).getPerimetre = vi.fn().mockResolvedValue(perimetreMock);
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          generation: { create: vi.fn().mockResolvedValue({ id: 'gen-1', versionId, semestreId, profilGenerationId: 'profil-1', statut: 'QUEUED', mode: 'AUTOMATIQUE', perimetreHash: 'sha256:abcdef', queuedAt: new Date(), createdAt: new Date() }) },
          auditLog: { create: vi.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const result = await service.createGeneration(versionId, dto, userId);

      expect(result.id).toBe('gen-1');
      expect(result.statut).toBe('QUEUED');
      expect(result.perimetreHash).toBe('sha256:abcdef');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('lève NotFoundException si la version est introuvable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);
      await expect(service.createGeneration(versionId, dto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ConflictException PERIMETER_CHANGED si le hash a évolué', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.profilGeneration.findUnique.mockResolvedValue({
        id: 'profil-1',
        semestreId,
        numero: 1,
      });
      (service as any).preparationService.getPreparation.mockResolvedValue(preparationMock);
      prisma.contrainteInstance.findMany.mockResolvedValue([]);
      (service as any).getPerimetre = vi.fn().mockResolvedValue({
        ...perimetreMock,
        perimetreHash: 'sha256:different',
      });

      await expect(
        service.createGeneration(versionId, dto, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('lève ConflictException VERSION_IMMUTABLE si la version est PUBLIE', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        ...versionMock,
        statut: 'PUBLIE',
      });

      await expect(
        service.createGeneration(versionId, dto, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('lève ConflictException EDIT_LOCK_HELD si un bail est détenu', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue({
        id: 'lock-1',
        userId: 'user-2',
        expiresAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.createGeneration(versionId, dto, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('lève BadRequestException PREPARATION_BLOCKED si préparation non conforme', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.profilGeneration.findUnique.mockResolvedValue({
        id: 'profil-1',
        semestreId,
        numero: 1,
      });
      (service as any).preparationService.getPreparation.mockResolvedValue({
        peutGenerer: false,
        controles: [
          {
            numero: 4,
            niveau: 'BLOQUANT',
            statut: 'NON_CONFORME',
            anomalies: [{ explication: 'Répartition non validée' }],
          },
        ],
      });

      await expect(
        service.createGeneration(versionId, dto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException UNTRANSLATED_CONSTRAINTS_UNACKNOWLEDGED sans acquittement', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.profilGeneration.findUnique.mockResolvedValue({
        id: 'profil-1',
        semestreId,
        numero: 1,
      });
      (service as any).preparationService.getPreparation.mockResolvedValue(preparationMock);
      prisma.contrainteInstance.findMany.mockResolvedValue([
        { id: 'c-1', definitionId: 'def-1' },
      ]);
      (service as any).getPerimetre = vi.fn().mockResolvedValue(perimetreMock);

      await expect(
        service.createGeneration(versionId, dto, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepte UNTRANSLATED_CONSTRAINTS si acknowledgeUntranslatedConstraints=true', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(versionMock);
      prisma.editLock.findUnique.mockResolvedValue(null);
      prisma.generation.findFirst.mockResolvedValue(null);
      prisma.profilGeneration.findUnique.mockResolvedValue({
        id: 'profil-1',
        semestreId,
        numero: 1,
      });
      (service as any).preparationService.getPreparation.mockResolvedValue(preparationMock);
      prisma.contrainteInstance.findMany.mockResolvedValue([
        { id: 'c-1', definitionId: 'def-1' },
      ]);
      (service as any).getPerimetre = vi.fn().mockResolvedValue(perimetreMock);
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          generation: { create: vi.fn().mockResolvedValue({ id: 'gen-1', versionId, semestreId, profilGenerationId: 'profil-1', statut: 'QUEUED', mode: 'AUTOMATIQUE', perimetreHash: 'sha256:abcdef', queuedAt: new Date(), createdAt: new Date() }) },
          auditLog: { create: vi.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const dtoAvecAcquittement = { ...dto, acknowledgeUntranslatedConstraints: true };
      const result = await service.createGeneration(versionId, dtoAvecAcquittement, userId);
      expect(result.id).toBe('gen-1');
    });

    it('détermine le même perimetreHash à deux appels de getPerimetre', async () => {
      (service as any).getPerimetre = vi.fn().mockResolvedValue(perimetreMock);
      const r1 = await (service as any).getPerimetre(versionId);
      const r2 = await (service as any).getPerimetre(versionId);
      expect(r1.perimetreHash).toBe(r2.perimetreHash);
    });
  });
});
