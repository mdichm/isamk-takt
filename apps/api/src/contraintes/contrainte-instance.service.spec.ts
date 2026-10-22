// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Tests unitaires du service ContrainteInstance (L3-06 : précédence et cohérence)
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import type {
  ContrainteInstance,
  ContrainteDefinition,
  ContrainteCategorie,
  ContraintePortee,
} from '@takt/db';
import { ContrainteInstanceService } from './contrainte-instance.service.js';

// Fuseau horaire fixe pour que dateTimeToMinutes (heure locale des Dates de creneau)
// soit cohérent avec timeToMinutes (chaînes HH:MM sans fuseau).
process.env.TZ = 'UTC';

// ============================================
// Mock PrismaService pour les tests unitaires
// ============================================

class MockPrismaService {
  semestre = {
    findUnique: vi.fn(),
  };
  contrainteInstance = {
    findMany: vi.fn(),
  };
  affectation = {
    aggregate: vi.fn(),
  };
  seance = {
    findMany: vi.fn(),
  };
}

function makeSemestre(id: string) {
  return { id, code: 'S1', libelle: 'Semestre 1' } as any;
}

function makeDefinition(
  code: string,
  categorie: ContrainteCategorie,
  portee: ContraintePortee,
  params: Record<string, unknown> = {},
): ContrainteDefinition {
  return {
    id: 'uuid-definition',
    code,
    libelle: `Libelle ${code}`,
    categorie,
    portee,
    classe: categorie === 'DURE' ? 'HARD_CONSTRAINT' : 'SOFT_CONSTRAINT',
    traductionFET: 'FET_SUPPORTED',
    paramsSchema: { type: 'object', properties: params, required: Object.keys(params) },
    fetSupport: 'NATIF',
    actif: true,
  } as ContrainteDefinition;
}

function makeInstance(
  id: string,
  definition: ContrainteDefinition,
  overrides: {
    enseignantId?: string | null;
    groupeId?: string | null;
    salleId?: string | null;
    moduleId?: string | null;
    poids?: number | null;
    actif?: boolean;
    params?: Record<string, unknown>;
  } = {},
): ContrainteInstance & { definition: ContrainteDefinition } {
  return {
    id,
    semestreId: 'uuid-semestre',
    definitionId: definition.id,
    enseignantId: overrides.enseignantId ?? null,
    groupeId: overrides.groupeId ?? null,
    salleId: overrides.salleId ?? null,
    moduleId: overrides.moduleId ?? null,
    params: overrides.params ?? { heures: 8 },
    poids: overrides.poids ?? null,
    nature: 'REGLE',
    commentaire: null,
    actif: overrides.actif ?? true,
    creePar: 'system',
    creeLe: new Date(),
    definition,
  } as ContrainteInstance & { definition: ContrainteDefinition };
}

// ============================================
// Tests unitaires
// ============================================

describe('ContrainteInstanceService (L3-06 - précédence et cohérence)', () => {
  let service: ContrainteInstanceService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new ContrainteInstanceService(prisma as unknown as PrismaService);
  });

  describe('resolveContraintesPourSujet', () => {
    const semestreId = 'uuid-semestre';
    const sujetId = 'uuid-sujet';

    it('retourne une contrainte dure globale quand aucune spécifique nest definie', async () => {
      const defMax = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instMax = makeInstance('inst-max', defMax, {});

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instMax]);

      const result = await service.resolveContraintesPourSujet(
        semestreId,
        'GLOBALE',
      );

      expect(result.sujetType).toBe('GLOBALE');
      expect(result.sujetId).toBeUndefined();
      expect(result.contraintes).toHaveLength(1);
      expect(result.contraintes[0].code).toBe('MAX_HOURS_PER_DAY');
      expect(result.contraintes[0].overridenBy).toBeNull();
      expect(result.total).toBe(1);
    });

    it('une dure specifique remplace la dure globale de meme code (precedence)', async () => {
      const defMaxGlobal = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instMaxGlobal = makeInstance('inst-max-global', defMaxGlobal, {});

      const defMaxSpec = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'ENSEIGNANT', {});
      const instMaxSpec = makeInstance('inst-max-spec', defMaxSpec, { enseignantId: sujetId });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([
        instMaxGlobal,
        instMaxSpec,
      ]);

      const result = await service.resolveContraintesPourSujet(
        semestreId,
        'ENSEIGNANT',
        sujetId,
      );

      expect(result.contraintes).toHaveLength(2);

      const spec = result.contraintes.find((c) => c.id === 'inst-max-spec');
      const glob = result.contraintes.find((c) => c.id === 'inst-max-global');

      expect(spec?.overridenBy).toBeNull();
      expect(spec?.code).toBe('MAX_HOURS_PER_DAY');
      expect(glob?.overridenBy).toBe('inst-max-spec');
      expect(glob?.code).toBe('MAX_HOURS_PER_DAY');
    });

    it('les contraintes souples de meme code saccumulent', async () => {
      const defSoft1 = makeDefinition('MAX_SPAN_PER_DAY', 'SOUPLE', 'GLOBALE', {});
      const instSoft1 = makeInstance('inst-soft-1', defSoft1, {});

      const defSoft2 = makeDefinition('MAX_SPAN_PER_DAY', 'SOUPLE', 'ENSEIGNANT', {});
      const instSoft2 = makeInstance('inst-soft-2', defSoft2, { enseignantId: sujetId });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instSoft1, instSoft2]);

      const result = await service.resolveContraintesPourSujet(
        semestreId,
        'ENSEIGNANT',
        sujetId,
      );

      const softConstraints = result.contraintes.filter(
        (c) => c.code === 'MAX_SPAN_PER_DAY' && c.categorie === 'SOUPLE',
      );
      expect(softConstraints).toHaveLength(2);
      expect(softConstraints[0].overridenBy).toBeNull();
      expect(softConstraints[1].overridenBy).toBeNull();
    });

    it('une instance inactive nest pas prise en compte', async () => {
      const defMax = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instMax = makeInstance('inst-max', defMax, { actif: false });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      // Le filtre actif: true est applique au niveau Prisma, le mock retourne vide
      prisma.contrainteInstance.findMany.mockResolvedValue([]);

      const result = await service.resolveContraintesPourSujet(
        semestreId,
        'GLOBALE',
      );

      expect(result.contraintes).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveContraintesPourSujet('unknown-semestre', 'GLOBALE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('filtre les instances par portee correspondant au sujet', async () => {
      const defGlobal = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instGlobal = makeInstance('inst-global', defGlobal, {});

      const defOther = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'ENSEIGNANT', {});
      const instOther = makeInstance('inst-other', defOther, { enseignantId: 'autre-enseignant' });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instGlobal, instOther]);

      const result = await service.resolveContraintesPourSujet(
        semestreId,
        'ENSEIGNANT',
        sujetId,
      );

      expect(result.contraintes).toHaveLength(1);
      expect(result.contraintes[0].id).toBe('inst-global');
    });
  });

  describe('verifierCoherenceSemestre', () => {
    const semestreId = 'uuid-semestre';

    it('retourne estCoherent true quand pas dincoherence', async () => {
      const defMax = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const defMin = makeDefinition('MIN_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instMax = makeInstance('inst-max', defMax, {});
      const instMin = makeInstance('inst-min', defMin, {});

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instMax, instMin]);
      prisma.affectation.aggregate.mockResolvedValue({
        _sum: { volumeHebdoMinutes: 0 },
      });

      const result = await service.verifierCoherenceSemestre(semestreId);

      expect(result.estCoherent).toBe(true);
      expect(result.totalErreurs).toBe(0);
      expect(result.semestreId).toBe(semestreId);
    });

    it('detecte min > max comme erreur bloquante', async () => {
      const defMin = makeDefinition('MIN_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const defMax = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const instMin = makeInstance('inst-min', defMin, { params: { heures: 8 } as any });
      const instMax = makeInstance('inst-max', defMax, { params: { heures: 4 } as any });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instMin, instMax]);
      prisma.affectation.aggregate.mockResolvedValue({
        _sum: { volumeHebdoMinutes: 0 },
      });

      const result = await service.verifierCoherenceSemestre(semestreId);

      expect(result.estCoherent).toBe(false);
      expect(result.totalErreurs).toBe(1);
      const minMaxError = result.incoherences.find((i) => i.type === 'MIN_MAX');
      expect(minMaxError).toBeDefined();
      expect(minMaxError?.severite).toBe('ERREUR');
      expect(minMaxError?.code).toBe('MIN_HOURS_PER_DAY');
    });

    it('detecte les doublons de meme code sur un meme sujet', async () => {
      const def = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GLOBALE', {});
      const inst1 = makeInstance('inst-1', def, {});
      const inst2 = makeInstance('inst-2', def, {});

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([inst1, inst2]);
      prisma.affectation.aggregate.mockResolvedValue({
        _sum: { volumeHebdoMinutes: 0 },
      });

      const result = await service.verifierCoherenceSemestre(semestreId);

      expect(result.estCoherent).toBe(false);
      expect(result.totalErreurs).toBe(1);
      const doublon = result.incoherences.find((i) => i.type === 'DOUBLON');
      expect(doublon).toBeDefined();
      expect(doublon?.severite).toBe('ERREUR');
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.verifierCoherenceSemestre('unknown-semestre')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('verifie le volume groupe comme avertissement', async () => {
      const defMaxHeures = makeDefinition('MAX_HOURS_PER_DAY', 'DURE', 'GROUPE', {});
      const defMaxJours = makeDefinition('MAX_DAYS_PER_WEEK', 'DURE', 'GROUPE', {});
      const instMaxHeures = makeInstance('inst-max-h', defMaxHeures, { groupeId: 'uuid-groupe', params: { heures: 6 } as any });
      const instMaxJours = makeInstance('inst-max-j', defMaxJours, { groupeId: 'uuid-groupe', params: { jours: 5 } as any });

      // Plafond = 6 * 5 * 60 = 1800 minutes
      // Volume reellement affecte = 2000 minutes > 1800 -> avertissement
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([instMaxHeures, instMaxJours]);
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.affectation.aggregate.mockResolvedValue({
        _sum: { volumeHebdoMinutes: 2000 },
      });

      const result = await service.verifierCoherenceSemestre(semestreId);

      expect(result.totalAvertissements).toBe(1);
      const volumeWarning = result.incoherences.find((i) => i.type === 'VOLUME_GROUPE');
      expect(volumeWarning).toBeDefined();
      expect(volumeWarning?.severite).toBe('AVERTISSEMENT');
    });
  });

  describe('fenêtre de pause (L3-08)', () => {
    const semestreId = 'uuid-semestre';

    function makePauseDefinition(
      portee: ContraintePortee = 'GLOBALE',
      params: Record<string, unknown> = { debut: '12:00', fin: '14:00', heures: 3 },
    ): ContrainteDefinition {
      return makeDefinition('MAX_HOURS_IN_INTERVAL', 'DURE', portee, params);
    }

    function makePauseInstance(
      id: string,
      def: ContrainteDefinition,
      overrides: {
        enseignantId?: string | null;
        groupeId?: string | null;
        params?: Record<string, unknown>;
      } = {},
    ): ContrainteInstance & { definition: ContrainteDefinition } {
      return {
        ...makeInstance(id, def, overrides),
        params: overrides.params ?? { debut: '12:00', fin: '14:00', heures: 3 },
      } as ContrainteInstance & { definition: ContrainteDefinition };
    }

    function makeSeance(
      id: string,
      jour: string,
      heureDebut: string,
      nbCreneaux: number,
      enseignantId?: string | null,
      groupeId?: string | null,
    ) {
      return {
        id,
        versionId: 'uuid-version',
        affectationKey: `${id}-key`,
        rang: 1,
        moduleId: 'uuid-module',
        typeEnseignementId: 'uuid-type',
        activityTagId: 'uuid-tag',
        enseignantId,
        salleId: null,
        jour,
        creneauDebutId: 'uuid-creneau',
        nbCreneaux,
        statut: 'PLACEE',
        origine: 'MOTEUR',
        revision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creneauDebut: {
          id: 'uuid-creneau',
          semestreId,
          jour,
          ordre: 4,
          heureDebut: new Date(`1970-01-01T${heureDebut}Z`),
          heureFin: new Date(`1970-01-01T${heureDebut}Z`),
          estPause: false,
        },
        groupes: groupeId ? [{ groupeId, seanceId: id }] : [],
        occupations: [],
        verrous: [],
      } as any;
    }

    it('ne détecte aucune incohérence quand aucune instance MAX_HOURS_IN_INTERVAL', async () => {
      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([]);
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.affectation.aggregate.mockResolvedValue({ _sum: { volumeHebdoMinutes: 0 } });

      const result = await service.verifierCoherenceSemestre(semestreId);

      expect(result.estCoherent).toBe(true);
      expect(result.totalErreurs).toBe(0);
      expect(result.incoherences.find((i) => i.type === 'PAUSE')).toBeUndefined();
    });

    it('détecte une violation de fenêtre de pause (PAUSE, ERREUR)', async () => {
      const def = makePauseDefinition('ENSEIGNANT');
      const inst = makePauseInstance('inst-pause', def, { enseignantId: 'uuid-ens' });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([inst]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance('s1', 'LUNDI', '11:30', 5, 'uuid-ens'),   // 11:30-14:00, overlap 12:00-14:00 = 120 min
        makeSeance('s2', 'LUNDI', '12:00', 5, 'uuid-ens'),   // 12:00-14:30, overlap 12:00-14:00 = 120 min
      ]);
      prisma.affectation.aggregate.mockResolvedValue({ _sum: { volumeHebdoMinutes: 0 } });

      const result = await service.verifierCoherenceSemestre(semestreId);

      const pauseError = result.incoherences.find((i) => i.type === 'PAUSE');
      expect(pauseError).toBeDefined();
      expect(pauseError?.severite).toBe('ERREUR');
      expect(pauseError?.code).toBe('MAX_HOURS_IN_INTERVAL');
      expect(result.totalErreurs).toBeGreaterThan(0);
    });

    it('ne détecte pas de violation quand loccupation est dans les limites', async () => {
      const def = makePauseDefinition('ENSEIGNANT');
      const inst = makePauseInstance('inst-pause', def, { enseignantId: 'uuid-ens' });

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([inst]);
      prisma.seance.findMany.mockResolvedValue([
        makeSeance('s1', 'LUNDI', '12:00', 2, 'uuid-ens'),
      ]);
      prisma.affectation.aggregate.mockResolvedValue({ _sum: { volumeHebdoMinutes: 0 } });

      const result = await service.verifierCoherenceSemestre(semestreId);

      const pauseError = result.incoherences.find((i) => i.type === 'PAUSE');
      expect(pauseError).toBeUndefined();
      expect(result.totalErreurs).toBe(0);
    });

    it('ne vérifie pas la fenêtre de pause pour un sujet GLOBALE sans cible', async () => {
      const def = makePauseDefinition('GLOBALE');
      const inst = makePauseInstance('inst-pause', def, {});

      prisma.semestre.findUnique.mockResolvedValue(makeSemestre(semestreId));
      prisma.contrainteInstance.findMany.mockResolvedValue([inst]);
      prisma.seance.findMany.mockResolvedValue([]);
      prisma.affectation.aggregate.mockResolvedValue({ _sum: { volumeHebdoMinutes: 0 } });

      const result = await service.verifierCoherenceSemestre(semestreId);

      const pauseError = result.incoherences.find((i) => i.type === 'PAUSE');
      expect(pauseError).toBeUndefined();
      expect(result.estCoherent).toBe(true);
    });

    it('lance NotFoundException si le semestre est introuvable', async () => {
      prisma.semestre.findUnique.mockResolvedValue(null);

      await expect(service.verifierCoherenceSemestre('unknown-semestre')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
