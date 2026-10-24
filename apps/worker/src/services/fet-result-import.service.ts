// SPDX-License-Identifier: AGPL-3.0-only
// @takt/worker — Service d'import du résultat FET (L4-09)

import { prisma } from '@takt/db';
import { GenerationStatut, SeanceStatut } from '@takt/db';
import type { Prisma } from '@takt/db';
import type { EngineInput, EngineSolution } from '@takt/contracts';
import {
  computeConflicts,
  computeSignature,
  type ConflictContext,
  type SeancePlacement,
  OccupancyIndex,
  IndispoSet,
  Reqs,
  VerrouIndex,
} from '@takt/conflict-engine';
import { GenerationMetricsService } from './generation-metrics.service.js';

/** Conflit SESSION_UNPLACED pour une séance non placée. */
function unplacedConflict(seanceId: string) {
  return {
    regleCode: 'SESSION_UNPLACED',
    type: 'COMPLETUDE' as const,
    severite: 'BLOQUANT' as const,
    objetType: 'seance',
    objetId: seanceId,
    seanceIds: [seanceId],
    message: 'Séance non placée',
    signature: computeSignature('SESSION_UNPLACED', [seanceId], 'seance', seanceId, []),
  };
}

/** Contexte ConflictEngine minimal (données vides). Seuls les SESSION_UNPLACED sont détectés. */
function buildMinimalConflictContext(versionId: string): ConflictContext {
  return {
    versionId,
    grille: { consecutifs: () => null },
    occ: new OccupancyIndex(),
    indispo: new IndispoSet(),
    reqs: new Reqs(),
    snapshot: new Map() as unknown as never,
    verrous: new VerrouIndex(),
    salles: new Map(),
    salleEquipements: new Map(),
    salleTags: new Map(),
    creneaux: new Map(),
    groupeEffectifs: new Map(),
    covoiturageGroupes: new Map(),
  } as unknown as ConflictContext;
}

let engineInputActivities: readonly any[] = [];

/**
 * Importe le résultat d'une génération FET et met à jour la Generation en base.
 *
 * Étapes :
 * 1. Déterminer le statut à partir du résultat brut FET
 * 2. Créer les GenerationSeance depuis l'EngineSolution (placées + NON_PLACEE)
 * 3. Appeler ConflictEngine.computeConflicts() pour détecter les conflits
 * 4. Calculer les métriques et le score
 * 5. Mettre à jour Generation (statut, metrics, score, finishedAt)
 *
 * @param generationId - ID de la génération à mettre à jour
 * @param engineSolution - Résultat de l'import FET
 * @param engineInput - Entrée moteur utilisée pour la génération
 * @param versionId - ID de la version cible
 * @param rawResult - Résultat brut FET (exitCode, resultText, durationMs)
 */
export async function importGenerationResult(
  generationId: string,
  engineSolution: EngineSolution,
  engineInput: EngineInput,
  versionId: string,
  rawResult: { exitCode: number; resultText: string; durationMs: number },
): Promise<void> {
  engineInputActivities = engineInput.activities;

  const { placedActivities, unplacedActivities } = engineSolution;
  const { exitCode, resultText, durationMs } = rawResult;
  const trimmed = resultText.trim();

  // ------------------------------------------------------------------
  // Déterminer le statut de la génération
  // ------------------------------------------------------------------
  let statut: GenerationStatut;
  let erreur: string | null = null;
  let cause: string | null = null;

  if (trimmed.includes('Generation successful')) {
    statut = unplacedActivities.length > 0
      ? GenerationStatut.SUCCEEDED_WITH_WARNINGS
      : GenerationStatut.SUCCEEDED;
  } else if (trimmed.includes('Impossible')) {
    statut = GenerationStatut.FAILED;
    erreur = 'Génération impossible : aucune solution complète trouvée';
    cause = 'IMPOSSIBLE';
  } else if (trimmed.includes('Time exceeded')) {
    statut = GenerationStatut.SUCCEEDED_WITH_WARNINGS;
    cause = 'TIME_EXCEEDED';
  } else if (trimmed.includes('Generation interrupted')) {
    statut = GenerationStatut.CANCELLED;
    erreur = 'Génération interrompue par l\'utilisateur';
    cause = 'INTERRUPTED';
  } else if (exitCode === 1) {
    statut = GenerationStatut.FAILED;
    erreur = `Erreur FET (code 1): ${trimmed}`;
    cause = 'FETCH_ERROR';
  } else if (exitCode < 0 || exitCode > 128) {
    statut = GenerationStatut.FAILED;
    erreur = `Processus FET tué ou planté (code ${exitCode})`;
    cause = 'PROCESS_KILLED';
  } else {
    statut = GenerationStatut.FAILED;
    erreur = `Statut FET non reconnu: ${trimmed}`;
    cause = 'UNKNOWN';
  }

  // ------------------------------------------------------------------
  // Charger la Generation pour le périmètre (affectationKey, rang)
  // ------------------------------------------------------------------
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    include: { profilGeneration: true },
  });
  if (!generation) {
    throw new Error(`Generation ${generationId} introuvable`);
  }

  const vId = generation.versionId ?? versionId;

  // ------------------------------------------------------------------
  // Construire les données des GenerationSeance
  // ------------------------------------------------------------------
  const placedActivityById = new Map(placedActivities.map((pa) => [pa.activityId, pa]));
  const periodById = new Map(engineInput.periods.map((p) => [p.id, p]));

  type SeanceData = {
    affectationKey: string;
    rang: number;
    groupeIds: string[];
    moduleId: string;
    typeEnseignementId: string;
    activityTagId: string;
    enseignantId: string;
    salleId: string | null;
    creneauDebutId: string | null;
    nbCreneaux: number;
    statut: SeanceStatut;
  };

  const seancesData: SeanceData[] = [];

  for (const activity of engineInput.activities) {
    const placement = placedActivityById.get(activity.id);
    const affectationKey = activity.id; // à affiner avec generation.perimetre (L4-13)
    const rang = 1;

    if (placement) {
      seancesData.push({
        affectationKey,
        rang,
        groupeIds: [...activity.groupIds],
        moduleId: activity.id,
        typeEnseignementId: activity.id,
        activityTagId: activity.activityTagIds[0] ?? '',
        enseignantId: activity.teacherIds[0] ?? '',
        salleId: placement.roomId,
        creneauDebutId: placement.periodId,
        nbCreneaux: activity.durationInSlots,
        statut: SeanceStatut.PLACEE,
      });
    } else {
      seancesData.push({
        affectationKey,
        rang,
        groupeIds: [...activity.groupIds],
        moduleId: activity.id,
        typeEnseignementId: activity.id,
        activityTagId: activity.activityTagIds[0] ?? '',
        enseignantId: activity.teacherIds[0] ?? '',
        salleId: null,
        creneauDebutId: null,
        nbCreneaux: activity.durationInSlots,
        statut: SeanceStatut.NON_PLACEE,
      });
    }
  }

  // Créer les GenerationSeance en base
  for (const s of seancesData) {
    await prisma.generationSeance.create({
      data: {
        generationId,
        affectationKey: s.affectationKey,
        rang: s.rang,
        groupeIds: s.groupeIds,
        moduleId: s.moduleId,
        typeEnseignementId: s.typeEnseignementId,
        activityTagId: s.activityTagId,
        enseignantId: s.enseignantId,
        salleId: s.salleId,
        creneauDebutId: s.creneauDebutId,
        nbCreneaux: s.nbCreneaux,
        statut: s.statut,
      },
    });
  }

  // ------------------------------------------------------------------
  // Appeler le ConflictEngine pour détecter les conflits
  // ------------------------------------------------------------------
  const seancesAvecPlacement: SeancePlacement[] = seancesData
    .filter((s) => s.statut === 'PLACEE' && s.creneauDebutId !== null)
    .map((s) => {
      const placement = placedActivityById.get(s.affectationKey);
      const period = placement ? periodById.get(placement.periodId) : undefined;
      return {
        seance: {
          id: s.affectationKey,
          enseignantId: s.enseignantId,
          salleId: s.salleId ?? '',
          groupes: s.groupeIds,
          nbCreneaux: s.nbCreneaux,
          tag: s.activityTagId,
          moduleId: s.moduleId,
          typeEnseignementId: s.typeEnseignementId,
          statut: 'PLACEE',
          versionId: vId,
        },
        jour: period ? String(period.dayIndex) : 'LUNDI',
        creneauDebut: s.creneauDebutId!,
        salle: s.salleId ?? '',
      };
    });

  const ctx = buildMinimalConflictContext(vId);
  const conflits = computeConflicts(seancesAvecPlacement, ctx);

  const unplacedConflicts = seancesData
    .filter((s) => s.statut === 'NON_PLACEE')
    .map((s) => unplacedConflict(s.affectationKey));

  const tousConflits = [...conflits, ...unplacedConflicts];

  // ------------------------------------------------------------------
  // Calculer les métriques et le score via le moteur de métriques (L4-17)
  // ------------------------------------------------------------------
  const poidsScore = (generation.profilGeneration?.poidsScore ??
    {}) as Record<string, number> | null;

  const metricsService = new GenerationMetricsService();
  const { metrics, score } = metricsService.compute({
    engineInput,
    engineSolution,
    conflits: tousConflits,
    poidsScore,
    statut,
    dureeMs: durationMs,
  });

  // Motif d'erreur/cause conservé dans les métriques brutes
  (metrics as Record<string, unknown>).cause = cause ?? null;

  // ------------------------------------------------------------------
  // Mettre à jour la Generation
  // ------------------------------------------------------------------
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      statut,
      finishedAt: new Date(),
      erreur,
      score,
      metrics: metrics as Prisma.InputJsonValue,
    },
  });
}
