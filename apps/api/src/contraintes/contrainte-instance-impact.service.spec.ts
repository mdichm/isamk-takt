// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de l'impact d'un changement de règle (L5-13)
// GET /contraintes/instances/{id}/impact-versions
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type {
  ContrainteInstance,
  ContrainteDefinition,
  ContraintePortee,
  VersionEdt,
  Seance,
} from '@takt/db';
import { ContrainteInstanceService } from './contrainte-instance.service.js';

// Fuseau horaire fixe pour que dateTimeToMinutes (heure locale des Dates de creneau)
// soit cohérent avec timeToMinutes (chaînes HH:MM sans fuseau).
process.env.TZ = 'UTC';

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  contrainteInstance = {
    findUnique: vi.fn(),
  };
  versionEdt = {
    findMany: vi.fn(),
  };
  seance = {
    findMany: vi.fn(),
  };
}

class MockVersionService {
  newRevision = vi.fn();
}

class MockConflitService {
  recomputeConflits = vi.fn();
}

function makeDefinition(
  code: string,
  portee: ContraintePortee,
): ContrainteDefinition {
  return {
    id: 'uuid-definition',
    code,
    libelle: `Libelle ${code}`,
    categorie: 'DURE',
    portee,
    classe: 'HARD_CONSTRAINT',
    traductionFET: 'FET_SUPPORTED',
    paramsSchema: {},
    fetSupport: 'NATIF',
    actif: true,
  } as ContrainteDefinition;
}

function makeInstance(
  id: string,
  definition: ContrainteDefinition,
  overrides: {
    semestreId?: string;
    enseignantId?: string | null;
    groupeId?: string | null;
    salleId?: string | null;
    moduleId?: string | null;
    actif?: boolean;
  } = {},
): ContrainteInstance & { definition: ContrainteDefinition } {
  return {
    id,
    semestreId: overrides.semestreId ?? 'uuid-semestre',
    definitionId: definition.id,
    enseignantId: overrides.enseignantId ?? null,
    groupeId: overrides.groupeId ?? null,
    salleId: overrides.salleId ?? null,
    moduleId: overrides.moduleId ?? null,
    params: {},
    poids: null,
    nature: 'REGLE',
    commentaire: null,
    actif: overrides.actif ?? true,
    creePar: 'system',
    creeLe: new Date(),
    definition,
  } as ContrainteInstance & { definition: ContrainteDefinition };
}

function makeVersion(
  id: string,
  semestreId: string,
  numero: string,
  statut: string,
): VersionEdt {
  return {
    id,
    semestreId,
    numero,
    statut,
    parentId: null,
    motif: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    revision: 0,
    cycleValidation: 0,
    soumisPar: null,
  } as VersionEdt;
}

function makeSeance(
  id: string,
  versionId: string,
  semestreId: string,
  enseignantId: string | null,
  salleId: string | null,
  groupeIds: string[],
  affectationKey: string,
): Seance {
  return {
    id,
    semestreId,
    versionId,
    enseignantId,
    salleId,
    affectationKey,
    rang: 1,
    tag: null,
    jour: null,
    creneauDebutId: null,
    nbCreneaux: 1,
    statut: 'NON_PLACEE',
    origine: 'MOTEUR',
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupes: groupeIds.map((gid) => ({ id: `sg-${id}-${gid}`, seanceId: id, groupeId: gid })),
    occupations: [],
    verrous: [],
  } as unknown as Seance;
}

// ============================================
// Tests unitaires
// ============================================

describe('ContrainteInstanceService.analyserImpactChangementRegle (L5-13)', () => {
  let service: ContrainteInstanceService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new ContrainteInstanceService(
      prisma as unknown as PrismaService,
      new MockVersionService() as any,
      new MockConflitService() as any,
    );
  });

  describe('Instance introuvable', () => {
    it('lève NotFoundException si linstance ny est pas', async () => {
      prisma.contrainteInstance.findUnique.mockResolvedValue(null);
      await expect(
        service.analyserImpactChangementRegle('uuid-inconnu'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Aucune version non publiée', () => {
    it('retourne une liste vide si aucune version du semestre', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'GLOBALE');
      const inst = makeInstance('inst-global', def, { semestreId: 'uuid-semestre' });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([]);
      const result = await service.analyserImpactChangementRegle('inst-global');
      expect(result.instanceId).toBe('inst-global');
      expect(result.code).toBe('MAX_HOURS_PER_DAY');
      expect(result.portee).toBe('GLOBALE');
      expect(result.versionsImpactees).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Portée GLOBALE', () => {
    it('impacte toutes les versions non publiées du semestre', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'GLOBALE');
      const inst = makeInstance('inst-global', def, { semestreId: 'uuid-semestre' });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
        makeVersion('v2', 'uuid-semestre', '1.1', 'VALIDE'),
      ]);
      prisma.seance.findMany.mockResolvedValue([]);
      const result = await service.analyserImpactChangementRegle('inst-global');
      expect(result.total).toBe(2);
      expect(result.versionsImpactees).toHaveLength(2);
      expect(result.versionsImpactees[0].raison).toBe('Règle globale modifiée');
      expect(result.versionsImpactees[1].raison).toBe('Règle globale modifiée');
    });

    it('n inclut pas les versions PUBLIE ni ARCHIVE', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'GLOBALE');
      const inst = makeInstance('inst-global', def, { semestreId: 'uuid-semestre' });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      // Le mock simule le filtrage statut notIn [PUBLIE, ARCHIVE] de Prisma
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v-edition', 'uuid-semestre', '3.0', 'EDITION'),
      ]);
      prisma.seance.findMany.mockResolvedValue([]);
      const result = await service.analyserImpactChangementRegle('inst-global');
      expect(result.total).toBe(1);
      expect(result.versionsImpactees[0].versionId).toBe('v-edition');
    });
  });

  describe('Portée ENSEIGNANT', () => {
    it('impacte les versions ayant des séances pour lenseignant', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'ENSEIGNANT');
      const inst = makeInstance('inst-ens', def, {
        semestreId: 'uuid-semestre',
        enseignantId: 'ens-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
        makeVersion('v2', 'uuid-semestre', '1.1', 'VALIDE'),
      ]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance('s1', 'v1', 'uuid-semestre', 'ens-1', null, [], 'g-1:m-1:td:ens-1'),
        makeSeance('s2', 'v2', 'uuid-semestre', 'ens-1', null, [], 'g-1:m-1:td:ens-1'),
      ]);
      const result = await service.analyserImpactChangementRegle('inst-ens');
      expect(result.total).toBe(2);
      expect(result.versionsImpactees[0].nbSeances).toBe(1);
      expect(result.versionsImpactees[1].nbSeances).toBe(1);
    });

    it('n impacte pas les versions sans séance pour cet enseignant', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'ENSEIGNANT');
      const inst = makeInstance('inst-ens', def, {
        semestreId: 'uuid-semestre',
        enseignantId: 'ens-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
      ]);
      // Aucun séance pour ens-1 : le mock retourne vide après filtrage Prisma
      prisma.seance.findMany.mockResolvedValue([]);
      const result = await service.analyserImpactChangementRegle('inst-ens');
      expect(result.total).toBe(0);
    });
  });

  describe('Portée GROUPE', () => {
    it('impacte les versions ayant des séances pour le groupe', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'GROUPE');
      const inst = makeInstance('inst-grp', def, {
        semestreId: 'uuid-semestre',
        groupeId: 'grp-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
      ]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance(
          's1',
          'v1',
          'uuid-semestre',
          null,
          null,
          ['grp-1'],
          'grp-1:m-1:td:ens-1',
        ),
      ]);
      const result = await service.analyserImpactChangementRegle('inst-grp');
      expect(result.total).toBe(1);
      expect(result.versionsImpactees[0].nbSeances).toBe(1);
    });
  });

  describe('Portée SALLE', () => {
    it('impacte les versions ayant des séances dans la salle', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'SALLE');
      const inst = makeInstance('inst-salle', def, {
        semestreId: 'uuid-semestre',
        salleId: 'salle-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
      ]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance('s1', 'v1', 'uuid-semestre', null, 'salle-1', [], 'g-1:m-1:td:ens-1'),
      ]);
      const result = await service.analyserImpactChangementRegle('inst-salle');
      expect(result.total).toBe(1);
      expect(result.versionsImpactees[0].nbSeances).toBe(1);
    });
  });

  describe('Portée MODULE', () => {
    it('impacte les versions ayant des séances pour le module via affectationKey', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'MODULE');
      const inst = makeInstance('inst-mod', def, {
        semestreId: 'uuid-semestre',
        moduleId: 'mod-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
      ]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance(
          's1',
          'v1',
          'uuid-semestre',
          null,
          null,
          [],
          'grp-1:mod-1:td:ens-1',
        ),
      ]);
      const result = await service.analyserImpactChangementRegle('inst-mod');
      expect(result.total).toBe(1);
      expect(result.versionsImpactees[0].nbSeances).toBe(1);
    });

    it('ne match pas un module dont lID est un préfixe dun autre', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'MODULE');
      const inst = makeInstance('inst-mod', def, {
        semestreId: 'uuid-semestre',
        moduleId: 'mod-1',
      });
      prisma.contrainteInstance.findUnique.mockResolvedValue(inst);
      prisma.versionEdt.findMany.mockResolvedValue([
        makeVersion('v1', 'uuid-semestre', '1.0', 'EDITION'),
      ]);
      // Aucune séance avec affectationKey contenant ":mod-1:" : le mock retourne vide
      prisma.seance.findMany.mockResolvedValue([]);
      const result = await service.analyserImpactChangementRegle('inst-mod');
      expect(result.total).toBe(0);
    });
  });
});
