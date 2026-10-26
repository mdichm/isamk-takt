// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires de modification de contrainte après validation (L5-14)
// PATCH /contraintes/instances/{id}/appliquer-apres-validation

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type {
  ContrainteInstance,
  ContrainteDefinition,
  ContraintePortee,
  VersionEdt,
} from '@takt/db';
import { ContrainteInstanceService } from './contrainte-instance.service.js';

// Fuseau horaire fixe pour que dateTimeToMinutes soit cohérent.
process.env.TZ = 'UTC';

// ============================================
// Mock VersionService (newRevision)
// ============================================
class MockVersionService {
  newRevision = vi.fn();
}

// ============================================
// Mock ConflitService (recomputeConflits)
// ============================================
class MockConflitService {
  recomputeConflits = vi.fn();
}

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  contrainteInstance = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  versionEdt = {
    findFirst: vi.fn(),
  };
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
    poids: 50,
    nature: 'REGLE',
    commentaire: null,
    actif: overrides.actif ?? true,
    definition,
  } as ContrainteInstance & { definition: ContrainteDefinition };
}

function makePublishedVersion(versionId: string, semestreId: string): VersionEdt {
  return {
    id: versionId,
    numero: '1.0',
    statut: 'PUBLIE',
    semestreId,
    annee: 2025,
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupeEdtId: null,
  } as unknown as VersionEdt;
}

function makeService(overrides: {
  prismaFindUnique?: unknown;
  prismaFindFirst?: unknown;
  prismaUpdate?: unknown;
  versionNewRevision?: unknown;
  conflitRecompute?: unknown;
}) {
  const prisma = new MockPrismaService();
  const versionService = new MockVersionService();
  const conflitService = new MockConflitService();

  if (overrides.prismaFindUnique !== undefined) {
    prisma.contrainteInstance.findUnique.mockResolvedValue(overrides.prismaFindUnique);
  }
  if (overrides.prismaFindFirst !== undefined) {
    prisma.versionEdt.findFirst.mockResolvedValue(overrides.prismaFindFirst);
  }
  if (overrides.prismaUpdate !== undefined) {
    prisma.contrainteInstance.update.mockResolvedValue(overrides.prismaUpdate);
  }
  if (overrides.versionNewRevision !== undefined) {
    versionService.newRevision.mockResolvedValue(overrides.versionNewRevision);
  }
  if (overrides.conflitRecompute !== undefined) {
    conflitService.recomputeConflits.mockResolvedValue(overrides.conflitRecompute);
  }

  return {
    service: new ContrainteInstanceService(prisma as any, versionService as any, conflitService as any),
    prisma,
    versionService,
    conflitService,
  };
}
// ============================================
// Tests
// ============================================

describe('ContrainteInstanceService.appliquerContrainteApresValidation', () => {
  const instanceId = 'uuid-instance';
  const semestreId = 'uuid-semestre';
  const definition = makeDefinition('C_HARD', 'GLOBALE');

  describe('Cas d erreur', () => {
    it('doit lever NotFoundException quand l instance est introuvable', async () => {
      const { service, prisma } = makeService({
        prismaFindUnique: null,
      });
      await expect(
        service.appliquerContrainteApresValidation(
          instanceId,
          { application: 'immediate' },
          'uuid-user',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.contrainteInstance.findUnique).toHaveBeenCalledWith({
        where: { id: instanceId },
        include: { definition: true },
      });
    });

    it('doit lever BadRequestException quand profilId manque pour next_generation', async () => {
      const publishedVersion = makePublishedVersion('uuid-published', semestreId);
      const { service, prisma } = makeService({
        prismaFindUnique: makeInstance(instanceId, definition, { semestreId }),
        prismaFindFirst: publishedVersion,
      });
      await expect(
        service.appliquerContrainteApresValidation(
          instanceId,
          { application: 'next_generation' },
          'uuid-user',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contrainteInstance.update).not.toHaveBeenCalled();
    });
  });

  describe('Cas A - aucune version PUBLIE -> modification directe', () => {
    it('doit modifier directement sans creer de version de travail', async () => {
      const { service, prisma, versionService, conflitService } = makeService({
        prismaFindUnique: makeInstance(instanceId, definition, { semestreId }),
        prismaFindFirst: null,
      });

      const result = await service.appliquerContrainteApresValidation(
        instanceId,
        { application: 'immediate', definitionId: 'uuid-def2' },
        'uuid-user',
      );

      expect(prisma.contrainteInstance.update).toHaveBeenCalledWith({
        where: { id: instanceId },
        data: { definitionId: 'uuid-def2' },
      });
      expect(versionService.newRevision).not.toHaveBeenCalled();
      expect(conflitService.recomputeConflits).not.toHaveBeenCalled();
      expect(result).toEqual({
        versionId: instanceId,
        statut: 'EDITION',
        actionRequiree: 'aucun',
        conflits: [],
        versionPublieeId: null,
      });
    });
  });
  describe('Cas B - version PUBLIE existe -> version de travail EDITION', () => {
    it('application immediate : cree version, recalcule conflits, actionRequiree aucun', async () => {
      const publishedVersion = makePublishedVersion('uuid-published', semestreId);
      const conflitBloquant = {
        id: 'uuid-conflit',
        regleCode: 'C_HARD',
        type: 'CONFLIT_RESSOURCE',
        severite: 'BLOQUANT',
        objetType: 'SEANCE',
        objetId: 'uuid-seance',
        seanceIds: ['uuid-seance'],
        message: 'Conflit bloquant',
      };
      const { service, prisma, versionService, conflitService } = makeService({
        prismaFindUnique: makeInstance(instanceId, definition, { semestreId }),
        prismaFindFirst: publishedVersion,
        versionNewRevision: {
          versionId: 'uuid-version-travail',
          numero: '1.1',
          statut: 'EDITION',
          parentId: 'uuid-published',
          at: new Date(),
        },
        conflitRecompute: [conflitBloquant],
      });

      const result = await service.appliquerContrainteApresValidation(
        instanceId,
        { application: 'immediate', nature: 'VOEU' },
        'uuid-user',
      );

      expect(versionService.newRevision).toHaveBeenCalledWith(
        'uuid-published',
        'uuid-user',
      );
      expect(prisma.contrainteInstance.update).toHaveBeenCalledWith({
        where: { id: instanceId },
        data: { nature: 'VOEU' },
      });
      expect(conflitService.recomputeConflits).toHaveBeenCalledWith(
        'uuid-version-travail',
      );
      expect(result).toEqual({
        versionId: 'uuid-version-travail',
        statut: 'EDITION',
        actionRequiree: 'regenerer',
        conflits: [conflitBloquant],
        versionPublieeId: 'uuid-published',
      });
    });

    it('application immediate sans conflits bloquants : actionRequiree aucun', async () => {
      const publishedVersion = makePublishedVersion('uuid-published', semestreId);
      const { service, versionService, conflitService } = makeService({
        prismaFindUnique: makeInstance(instanceId, definition, { semestreId }),
        prismaFindFirst: publishedVersion,
        versionNewRevision: {
          versionId: 'uuid-version-travail',
          numero: '1.1',
          statut: 'EDITION',
          parentId: 'uuid-published',
          at: new Date(),
        },
        conflitRecompute: [],
      });

      const result = await service.appliquerContrainteApresValidation(
        instanceId,
        { application: 'immediate' },
        'uuid-user',
      );

      expect(result.actionRequiree).toBe('aucun');
      expect(result.conflits).toEqual([]);
    });

    it('application next_generation : actionRequiree regenerer, pas de recompute', async () => {
      const publishedVersion = makePublishedVersion('uuid-published', semestreId);
      const { service, prisma, versionService, conflitService } = makeService({
        prismaFindUnique: makeInstance(instanceId, definition, { semestreId }),
        prismaFindFirst: publishedVersion,
        versionNewRevision: {
          versionId: 'uuid-version-travail',
          numero: '1.1',
          statut: 'EDITION',
          parentId: 'uuid-published',
          at: new Date(),
        },
      });

      const result = await service.appliquerContrainteApresValidation(
        instanceId,
        { application: 'next_generation', profilId: 'uuid-profil' },
        'uuid-user',
      );

      expect(versionService.newRevision).toHaveBeenCalledWith(
        'uuid-published',
        'uuid-user',
      );
      expect(prisma.contrainteInstance.update).toHaveBeenCalled();
      expect(conflitService.recomputeConflits).not.toHaveBeenCalled();
      expect(result).toEqual({
        versionId: 'uuid-version-travail',
        statut: 'EDITION',
        actionRequiree: 'regenerer',
        conflits: [],
        versionPublieeId: 'uuid-published',
      });
    });
  });
});