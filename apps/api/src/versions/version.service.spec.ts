// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service de version (L3-09)
import { NotFoundException, BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { PreparationService } from '../preparation/preparation.service.js';
import { ConflitService } from '../conflit/conflit.service.js';
import { VersionService } from './version.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

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
      enseignant: { findMany: vi.fn() },
      salle: { findMany: vi.fn() },
      module: { findMany: vi.fn() },
      typeEnseignement: { findMany: vi.fn() },
      profilGeneration: { findFirst: vi.fn(), findUnique: vi.fn() },
      repartition: { findFirst: vi.fn() },
      snapshot: { findFirst: vi.fn() },
      versionEdt: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
      versionSnapshot: { findMany: vi.fn(), createMany: vi.fn() },
      snapshotAffectation: { findMany: vi.fn() },
      seance: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
      editLock: { findUnique: vi.fn(), deleteMany: vi.fn() },
      parametreWorkflow: {
        findUnique: vi.fn().mockResolvedValue({
          validationPlanningRequise: true,
          publicationRequise: true,
        }),
      },
      workflowTransition: { create: vi.fn(), findMany: vi.fn() },
      generation: { findFirst: vi.fn() },
      contrainteInstance: { findMany: vi.fn() },
      conflit: { findMany: vi.fn() },
      verrouSeance: { count: vi.fn() },
      auditLog: { create: vi.fn() },
      avertissementAccepte: { findMany: vi.fn() },
      $transaction: vi.fn(async (cb: any) => cb(prisma)),
      userSystemRole: { findMany: vi.fn().mockResolvedValue([]) },
      departement: {
        findUnique: vi.fn().mockResolvedValue({ id: 'dept-1', code: 'INFO' }),
        findMany: vi.fn(),
      },
    };

    const preparationService = {
      getPreparation: vi.fn(),
    };

    const bossMock = {
      send: vi.fn().mockResolvedValue('job-id'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PreparationService, useValue: preparationService },
        { provide: ConflitService, useValue: { recomputeConflits: vi.fn() } },
        { provide: 'BOSS', useValue: bossMock },
        { provide: PolicyService, useValue: { checkSegregationOfDuties: vi.fn() } },
        {
          provide: NotificationsService,
          useValue: { creerNotifications: vi.fn().mockResolvedValue({ count: 0 }) },
        },
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
  // ============================================
  // Contrôle de soumission (L5-02)
  // ============================================

  const versionIdSoumission = 'version-1';

  function setupTransitionMocks({
    conflitBloquant = false,
    couvertureIncomplete = false,
    statutInitial = 'EDITION',
    statutFinal = 'PRET_POUR_VALIDATION',
    cycleValidationFinal = 0,
  }: {
    conflitBloquant?: boolean;
    couvertureIncomplete?: boolean;
    statutInitial?: string;
    statutFinal?: string;
    cycleValidationFinal?: number;
  } = {}) {
    // 1er appel findUnique (début de transition) -> statut initial
    prisma.versionEdt.findUnique.mockResolvedValueOnce({
      id: versionIdSoumission,
      numero: '1.0',
      statut: statutInitial,
      revision: 1,
    });
    // 2ème appel findUnique (updated à la fin) -> statut final
    prisma.versionEdt.findUnique.mockResolvedValue({
      id: versionIdSoumission,
      numero: '1.0',
      statut: statutFinal,
      revision: 2,
      cycleValidation: cycleValidationFinal,
    } as any);
    prisma.seance.findFirst.mockResolvedValue(null);
    (service as any).conflitService.recomputeConflits = vi.fn().mockResolvedValue(
      conflitBloquant
        ? [
            {
              id: 'c1',
              regleCode: 'R1',
              type: 'CONFLIT_SALLE',
              severite: 'BLOQUANT',
              objetType: 'Seance',
              objetId: 's1',
              seanceIds: ['s1'],
              message: 'Conflit de salle',
              signature: 'sig1',
              resoluLe: null,
              createdAt: new Date(),
            },
          ]
        : [],
    );
    prisma.seance.findMany.mockResolvedValue(
      couvertureIncomplete
        ? [{ affectationKey: 'g1:m1:t1:e1', statut: 'NON_PLACEE' }]
        : [{ affectationKey: 'g1:m1:t1:e1', statut: 'PLACEE' }],
    );
    prisma.avertissementAccepte.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.versionEdt.update.mockResolvedValue({
      id: versionIdSoumission,
      numero: '1.0',
      statut: statutFinal,
      revision: 2,
      cycleValidation: cycleValidationFinal,
    } as any);
    prisma.workflowTransition.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});
    prisma.editLock.deleteMany.mockResolvedValue({ count: 1 });
  }

  it('lève 422 VERSION_NOT_SUBMITTABLE sur MARQUER_PRET quand un conflit bloquant n\'est pas résolu', async () => {
    setupTransitionMocks({ conflitBloquant: true });

    try {
      await service.transition(versionIdSoumission, 'MARQUER_PRET', 'user-1');
      throw new Error('aurait dû lever');
    } catch (e: any) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.code).toBe('VERSION_NOT_SUBMITTABLE');
      expect(e.response.status).toBe(422);
      expect(e.response.conflits.length).toBe(1);
      expect(e.response.conflits[0].severite).toBe('BLOQUANT');
    }
  });

  it('lève 422 VERSION_NOT_SUBMITTABLE sur MARQUER_PRET quand la couverture est incomplète', async () => {
    setupTransitionMocks({ couvertureIncomplete: true });

    try {
      await service.transition(versionIdSoumission, 'MARQUER_PRET', 'user-1');
      throw new Error('aurait dû lever');
    } catch (e: any) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect(e.response.code).toBe('VERSION_NOT_SUBMITTABLE');
      expect(e.response.status).toBe(422);
      expect(e.response.couverture.length).toBe(1);
      expect(e.response.couverture[0].ecart).toBeGreaterThan(0);
    }
  });

  it('MARQUER_PRET réussit quand pas de conflit bloquant et couverture complète', async () => {
    setupTransitionMocks({
      statutInitial: 'EDITION',
      statutFinal: 'PRET_POUR_VALIDATION',
      cycleValidationFinal: 0,
    });

    const result = await service.transition(versionIdSoumission, 'MARQUER_PRET', 'user-1');

    expect(result.action).toBe('MARQUER_PRET');
    expect(result.vers).toBe('PRET_POUR_VALIDATION');
    expect(result.cycleValidation).toBe(0);
    expect(prisma.editLock.deleteMany).not.toHaveBeenCalled();
  });

  it('SOUMETTRE réussit, incrémente cycleValidation et libère le editLock', async () => {
    setupTransitionMocks({
      statutInitial: 'PRET_POUR_VALIDATION',
      statutFinal: 'EN_VALIDATION',
      cycleValidationFinal: 1,
    });

    const result = await service.transition(versionIdSoumission, 'SOUMETTRE', 'user-1');

    expect(result.action).toBe('SOUMETTRE');
    expect(result.vers).toBe('EN_VALIDATION');
    expect(result.cycleValidation).toBe(1);
    expect(prisma.editLock.deleteMany).toHaveBeenCalledWith({ where: { versionId: versionIdSoumission } });
  });

  it('RESOUMETTRE réussit, incrémente cycleValidation et libère le editLock', async () => {
    setupTransitionMocks({
      statutInitial: 'CORRECTION',
      statutFinal: 'EN_VALIDATION',
      cycleValidationFinal: 1,
    });

    const result = await service.transition(versionIdSoumission, 'RESOUMETTRE', 'user-1');

    expect(result.action).toBe('RESOUMETTRE');
    expect(result.vers).toBe('EN_VALIDATION');
    expect(result.cycleValidation).toBe(1);
    expect(prisma.editLock.deleteMany).toHaveBeenCalledWith({ where: { versionId: versionIdSoumission } });
  });

  describe('getHistory', () => {
    const versionId = 'version-history-1';
    const now = new Date('2026-01-15T10:00:00Z');

    it('retourne la chronologie des transitions triée par date décroissante', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId } as any);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: 't-2',
          versionId,
          de: 'EDITION',
          vers: 'PRET_POUR_VALIDATION',
          userId: 'user-1',
          automatique: false,
          commentaire: 'Prête pour validation',
          at: now,
          user: { id: 'user-1', email: 'alice@takt.fr', firstName: 'Alice', lastName: 'Dupont' },
        },
        {
          id: 't-1',
          versionId,
          de: 'BROUILLON',
          vers: 'EDITION',
          userId: 'user-1',
          automatique: false,
          commentaire: null,
          at: new Date('2026-01-14T09:00:00Z'),
          user: { id: 'user-1', email: 'alice@takt.fr', firstName: 'Alice', lastName: 'Dupont' },
        },
      ] as any);

      const result = await service.getHistory(versionId);

      expect(result.versionId).toBe(versionId);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].id).toBe('t-2');
      expect(result.entries[0].action).toBe('MARQUER_PRET');
      expect(result.entries[0].userName).toBe('Alice Dupont');
      expect(result.entries[0].automatique).toBe(false);
      expect(result.entries[0].commentaire).toBe('Prête pour validation');
      expect(result.entries[1].id).toBe('t-1');
      expect(result.entries[1].action).toBe('DEMARRER_EDITION');
      expect(result.entries[1].automatique).toBe(false);
      expect(prisma.workflowTransition.findMany).toHaveBeenCalledWith({
        where: { versionId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { at: 'desc' },
      });
    });

    it('retourne une liste vide quand il n y a pas de transition', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId } as any);
      prisma.workflowTransition.findMany.mockResolvedValue([]);

      const result = await service.getHistory(versionId);

      expect(result.versionId).toBe(versionId);
      expect(result.entries).toEqual([]);
    });

    it('lève NotFoundException si la version est introuvable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);

      await expect(service.getHistory(versionId)).rejects.toThrow(NotFoundException);
    });

    it('utilise le email comme nom quand les noms sont absents', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({ id: versionId } as any);
      prisma.workflowTransition.findMany.mockResolvedValue([
        {
          id: 't-1',
          versionId,
          de: 'EDITION',
          vers: 'ARCHIVE',
          userId: 'user-2',
          automatique: true,
          commentaire: null,
          at: now,
          user: { id: 'user-2', email: 'bob@takt.fr', firstName: null, lastName: null },
        },
      ] as any);

      const result = await service.getHistory(versionId);

      expect(result.entries[0].userName).toBe('bob@takt.fr');
      expect(result.entries[0].action).toBe('ABANDONNER');
      expect(result.entries[0].automatique).toBe(true);
    });
  });

  // ============================================
  // Nouvelle révision (L5-10)
  // ============================================
  describe('newRevision', () => {
    const parentId = 'version-publiee-1';
    const userId = 'user-gestionnaire';

    const seanceAvecGroupeEtVerrou = {
      id: 'seance-1',
      semestreId,
      versionId: parentId,
      affectationKey: 'g1:m1:t1:e1',
      rang: 1,
      tag: null,
      jour: 'LUNDI',
      creneauDebutId: 'creneau-1',
      nbCreneaux: 2,
      statut: 'PLACEE' as any,
      origine: 'MOTEUR' as any,
      enseignantId: 'ens-1',
      salleId: 'salle-1',
      groupes: [{ groupeId: 'groupe-1' }],
      verrous: [
        { id: 'verrou-1', type: 'SALLE' as any, justification: 'Salle imposée', auteurId: 'user-1', leveLe: null, levePar: null },
      ],
    };

    beforeEach(() => {
      prisma.seanceGroupe = { createMany: vi.fn() };
      prisma.verrouSeance = { createMany: vi.fn() };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    });

    it('crée une version enfant EDITION avec parentId, séances et verrous copiés, numéro mineur+1', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: parentId,
        numero: '1.0',
        statut: 'PUBLIE',
        semestreId,
        seances: [seanceAvecGroupeEtVerrou],
      } as any);
      prisma.versionEdt.create.mockResolvedValue({
        id: 'version-enfant-1',
        numero: '1.1',
        statut: 'EDITION',
      } as any);
      prisma.seance.create.mockResolvedValue({ id: 'seance-enfant-1' } as any);
      prisma.workflowTransition.create.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.newRevision(parentId, userId);

      expect(result.versionId).toBe('version-enfant-1');
      expect(result.numero).toBe('1.1');
      expect(result.statut).toBe('EDITION');
      expect(result.parentId).toBe(parentId);
      expect(prisma.versionEdt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId,
            statut: 'EDITION',
            numero: '1.1',
            semestreId,
            auteurId: userId,
          }),
        }),
      );
      // La séance a été copiée
      expect(prisma.seance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionId: 'version-enfant-1',
            affectationKey: 'g1:m1:t1:e1',
            rang: 1,
          }),
        }),
      );
      // Le verrou a été copié sur la nouvelle séance
      expect(prisma.verrouSeance.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              type: 'SALLE',
              seanceId: 'seance-enfant-1',
            }),
          ]),
        }),
      );
      // Historisation
      expect(prisma.workflowTransition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            de: 'PUBLIE',
            vers: 'EDITION',
            userId,
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'VERSION_NEW_REVISION',
          }),
        }),
      );
    });

    it('passe de 2.0 à 2.1 (mineur+1) pour une révision', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: parentId,
        numero: '2.0',
        statut: 'PUBLIE',
        semestreId,
        seances: [],
      } as any);
      prisma.versionEdt.create.mockResolvedValue({
        id: 'version-enfant-2',
        numero: '2.1',
        statut: 'EDITION',
      } as any);
      prisma.seance.create.mockResolvedValue({} as any);
      prisma.workflowTransition.create.mockResolvedValue({} as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.newRevision(parentId, userId);

      expect(result.numero).toBe('2.1');
      expect(prisma.versionEdt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numero: '2.1' }),
        }),
      );
    });

    it('lève NotFoundException si la version parente est introuvable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue(null);

      await expect(service.newRevision(parentId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ConflictException si la version parente n\'est pas PUBLIE', async () => {
      prisma.versionEdt.findUnique.mockResolvedValue({
        id: parentId,
        numero: '1.0',
        statut: 'EDITION',
        semestreId,
        seances: [],
      } as any);

      await expect(service.newRevision(parentId, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
  // ============================================
  // Différence entre deux versions (L5-11)
  // ============================================

  describe('getDiff', () => {
    const versionId = 'version-1';
    const againstId = 'version-2';
    const version = { id: versionId, numero: '1.1', semestreId } as any;
    const against = { id: againstId, numero: '1.0', semestreId } as any;

    beforeEach(() => {
      prisma.versionEdt.findUnique
        .mockResolvedValueOnce(version)
        .mockResolvedValueOnce(against);
    });
    it('retourne le diff avec séances identiques, déplacées et modifiées', async () => {
      prisma.seance.findMany
        .mockResolvedValueOnce([
          {
            affectationKey: 'INFO:M01:CM:ENS01',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-1',
            enseignantId: 'ens-1',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M01:CM:ENS01',
            rang: 2,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-1',
            enseignantId: 'ens-1',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M02:TD:ENS02',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-2',
            salleId: 'salle-1',
            enseignantId: 'ens-2',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M03:TD:ENS03',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-2',
            enseignantId: 'ens-3',
            statut: 'PLACEE',
          },
        ])
        .mockResolvedValueOnce([
          {
            affectationKey: 'INFO:M01:CM:ENS01',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-1',
            enseignantId: 'ens-1',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M01:CM:ENS01',
            rang: 2,
            jour: 'MARDI',
            creneauDebutId: 'creneau-3',
            salleId: 'salle-1',
            enseignantId: 'ens-1',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M02:TD:ENS02',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-2',
            salleId: 'salle-99',
            enseignantId: 'ens-2',
            statut: 'PLACEE',
          },
          {
            affectationKey: 'INFO:M04:TD:ENS04',
            rang: 1,
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-5',
            enseignantId: 'ens-4',
            statut: 'PLACEE',
          },
        ]);
      prisma.conflit.findMany
        .mockResolvedValueOnce([
          { signature: 'sig-a', resoluLe: null },
          { signature: 'sig-b', resoluLe: null },
          { signature: 'sig-c', resoluLe: new Date() },
        ])
        .mockResolvedValueOnce([
          { signature: 'sig-a', resoluLe: null },
          { signature: 'sig-d', resoluLe: null },
        ]);
      prisma.verrouSeance.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await service.getDiff(versionId, againstId);

      expect(result.versionId).toBe(versionId);
      expect(result.versionNumero).toBe('1.1');
      expect(result.againstId).toBe(againstId);
      expect(result.againstNumero).toBe('1.0');
      expect(result.seancesIdentiques).toBe(1);
      expect(result.seancesDifferentes).toBe(2);
      expect(result.seulesAGauche).toEqual(['INFO:M03:TD:ENS03#1']);
      expect(result.seulesADroite).toEqual(['INFO:M04:TD:ENS04#1']);
      expect(result.changements).toHaveLength(2);
      expect(result.changements[0].cle).toBe('INFO:M01:CM:ENS01#2');
      expect(result.changements[0].type).toBe('DEPLACE');
      expect(result.changements[1].cle).toBe('INFO:M02:TD:ENS02#1');
      expect(result.changements[1].type).toBe('SALLE_MODIFIEE');
      expect(result.conflits).toEqual({ apparus: 1, disparus: 1 });
      expect(result.verrous).toEqual({ respectesGauche: 2, respectesDroite: 1 });
    });
    it('retourne aucune différence quand les versions sont identiques', async () => {
      const seances = [
        {
          affectationKey: 'INFO:M01:CM:ENS01',
          rang: 1,
          jour: 'LUNDI',
          creneauDebutId: 'creneau-1',
          salleId: 'salle-1',
          enseignantId: 'ens-1',
          statut: 'PLACEE',
        },
      ];
      prisma.seance.findMany.mockResolvedValue(seances).mockResolvedValue(seances);
      prisma.conflit.findMany.mockResolvedValue([]).mockResolvedValue([]);
      prisma.verrouSeance.count.mockResolvedValue(0).mockResolvedValue(0);

      const result = await service.getDiff(versionId, againstId);

      expect(result.seancesIdentiques).toBe(1);
      expect(result.seancesDifferentes).toBe(0);
      expect(result.changements).toEqual([]);
      expect(result.seulesAGauche).toEqual([]);
      expect(result.seulesADroite).toEqual([]);
      expect(result.conflits).toEqual({ apparus: 0, disparus: 0 });
      expect(result.verrous).toEqual({ respectesGauche: 0, respectesDroite: 0 });
    });

    it('lève NotFoundException si la version courante est introuvable', async () => {
      prisma.versionEdt.findUnique.mockReset();
      prisma.versionEdt.findUnique.mockResolvedValueOnce(null);

      await expect(service.getDiff(versionId, againstId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si la version de référence est introuvable', async () => {
      prisma.versionEdt.findUnique.mockReset();
      prisma.versionEdt.findUnique.mockResolvedValueOnce(version).mockResolvedValueOnce(null);
      prisma.seance.findMany.mockResolvedValue([]);

      await expect(service.getDiff(versionId, againstId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève ConflictException si les versions ne sont pas du même semestre', async () => {
      prisma.versionEdt.findUnique.mockReset();
      prisma.versionEdt.findUnique
        .mockResolvedValueOnce({ id: versionId, numero: '1.1', semestreId: 'semestre-1' })
        .mockResolvedValueOnce({ id: againstId, numero: '1.0', semestreId: 'semestre-2' });
      prisma.seance.findMany.mockResolvedValue([]);

      await expect(service.getDiff(versionId, againstId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============================================
  // Provenance (L5-12)
  // ============================================

  describe('getProvenance', () => {
    const versionId = 'version-provenance-1';
    const generationSourceId = 'gen-1';
    const profileId = 'profile-1';
    const snapshot1Id = 'snapshot-1';
    const crs1Id = 'crs-1';

    beforeEach(() => {
      prisma.versionEdt.findUnique.mockReset();
    });

    it('retourne la provenance complète pour une version issue d une génération', async () => {
      prisma.versionEdt.findUnique.mockResolvedValueOnce({
        id: versionId,
        numero: '1.1',
        statut: 'PUBLIE',
        generationSourceId,
        generationSource: {
          id: generationSourceId,
          statut: 'TERMINEE',
          mode: 'AUTOMATIQUE',
          engine: 'fet',
          engineVersion: '7.12.0',
          perimetreHash: 'hash-perimetre',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          profil: {
            id: profileId,
            code: 'PROF-INFO',
            numero: 3,
            libelle: 'Profil INFO',
            engineVersion: '7.12.0',
            builderVersion: '1.0.0',
          },
          fichierMoteur: {
            id: 'fm-1',
            engine: 'fet',
            engineVersion: '7.12.0',
            builderVersion: '1.0.0',
            storageKey: 'storage/key',
            sha256: 'abc123',
          },
        },
        snapshots: [
          {
            snapshot: {
              id: snapshot1Id,
              repartitionId: 'rep-1',
              revision: 2,
              contentHash: 'hash-snap',
              parAdministrateur: true,
              validatedAt: new Date('2024-01-16T12:00:00Z'),
              chargeRuleSet: {
                id: crs1Id,
                code: 'CRS-INFO',
                libelle: 'Règles de charge INFO',
              },
            },
          },
        ],
        seances: [],
      });

      const result = await service.getProvenance(versionId);

      expect(result.versionId).toBe(versionId);
      expect(result.versionNumero).toBe('1.1');
      expect(result.statut).toBe('PUBLIE');
      expect(result.origine).toBe('GENERATION');
      expect(result.generation).toBeDefined();
      expect(result.generation!.id).toBe(generationSourceId);
      expect(result.generation!.mode).toBe('AUTOMATIQUE');
      expect(result.generation!.profil).toBeDefined();
      expect(result.generation!.profil!.code).toBe('PROF-INFO');
      expect(result.generation!.profil!.numero).toBe(3);
      expect(result.snapshots).toHaveLength(1);
      expect(result.snapshots![0].id).toBe(snapshot1Id);
      expect(result.snapshots![0].chargeRuleSet.id).toBe(crs1Id);
      expect(result.chargeRuleSets).toHaveLength(1);
      expect(result.chargeRuleSets![0].code).toBe('CRS-INFO');
      expect(result.adaptateur).toBeDefined();
      expect(result.adaptateur!.nom).toBe('fet');
      expect(result.seancesOrigine).toBeUndefined();
      expect(result.at).toBeDefined();
    });

    it('retourne la provenance pour une version saisie manuellement', async () => {
      prisma.versionEdt.findUnique.mockResolvedValueOnce({
        id: versionId,
        numero: '2.0',
        statut: 'EDITION',
        generationSourceId: null,
        generationSource: null,
        snapshots: [
          {
            snapshot: {
              id: snapshot1Id,
              repartitionId: 'rep-1',
              revision: 1,
              contentHash: 'hash-snap-2',
              parAdministrateur: false,
              validatedAt: new Date('2024-02-01T09:00:00Z'),
              chargeRuleSet: {
                id: crs1Id,
                code: 'CRS-INFO',
                libelle: 'Règles de charge INFO',
              },
            },
          },
        ],
        seances: [
          {
            id: 'seance-1',
            affectationKey: 'INFO:M01:CM:ENS01#1',
            jour: 'LUNDI',
            creneauDebutId: 'creneau-1',
            salleId: 'salle-1',
            enseignantId: 'ens-1',
            statut: 'PLACEE',
          },
        ],
      });

      const result = await service.getProvenance(versionId);

      expect(result.origine).toBe('MANUELLE');
      expect(result.generation).toBeNull();
      expect(result.snapshots).toHaveLength(1);
      expect(result.chargeRuleSets).toHaveLength(1);
      expect(result.chargeRuleSet).toBeDefined();
      expect(result.chargeRuleSet!.code).toBe('CRS-INFO');
      expect(result.adaptateur).toBeUndefined();
      expect(result.seancesOrigine).toHaveLength(1);
      expect(result.seancesOrigine![0].affectationKey).toBe('INFO:M01:CM:ENS01#1');
    });

    it('lève NotFoundException si la version est introuvable', async () => {
      prisma.versionEdt.findUnique.mockResolvedValueOnce(null);

      await expect(service.getProvenance(versionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
