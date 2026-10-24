// SPDX-License-Identifier: AGPL-3.0-only
// Consumer pg-boss pour la file de génération FET
// Conforme ST §4.6.4, §4.6.5 : exécution isolée de fet-cl, import du résultat,
// reprise idempotente, garde d'un seul job par semestre.

import type { Job } from 'pg-boss';
import { trace, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import { prisma } from '@takt/db';
import { GenerationStatut } from '@takt/db';
import {
  claimGenerationJob,
  setupLockRenewal,
} from '../services/job-claim.service.js';
import {
  claimGenerationForSemester,
} from '../guards/single-job-per-semester.guard.js';
import { handleDeadLetter, isDeadLetter } from '../services/dead-letter.service.js';
import { FetAdapter } from '@takt/engine-fet';
import type { EngineRunOptions, EngineRawResult, EngineFile } from '@takt/contracts';
import { randomBytes } from 'crypto';

// Données attendues dans le job pg-boss pour une génération
interface GenerationJobData {
  generationId: string;
  semestreId: string;
  traceparent?: string;
  tracestate?: string;
}

/**
 * Construit les données de job à partir d'un objet Job pg-boss.
 */
function extractJobData(job: Job): GenerationJobData | null {
  const data = job.data as Record<string, unknown>;
  const generationId = data.generationId as string | undefined;
  const semestreId = data.semestreId as string | undefined;

  if (!generationId || !semestreId) {
    return null;
  }

  return {
    generationId,
    semestreId,
    traceparent: data.traceparent as string | undefined,
    tracestate: data.tracestate as string | undefined,
  };
}

/**
 * Met à jour le statut d'une génération en base.
 */
async function updateGenerationStatus(
  generationId: string,
  updates: {
    statut?: GenerationStatut;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    erreur?: string | null;
    score?: number | null;
    metrics?: Record<string, unknown> | null;
    resultKey?: string | null;
    logKey?: string | null;
    engineVersion?: string | null;
  },
): Promise<void> {
  await prisma.generation.update({
    where: { id: generationId },
    data: updates,
  });
}

/**
 * Traite un job de génération de manière idempotente.
 *
 * Étapes :
 * 1. Claim idempotent (rejet si génération déjà terminale)
 * 2. Guard un seul job par semestre
 * 3. Marquer RUNNING en base
 * 4. Exécuter la génération (TODO : logique FET réelle)
 * 5. Marquer terminale (SUCCEEDED / FAILED / TIMED_OUT)
 *
 * Si une étape échoue, le job est rejetté pour que pg-boss gère le retry.
 * Après MAX_ATTEMPTS, le job va en dead-letter.
 *
 * @param job - job pg-boss à traiter
 */
export async function handleGenerationJob(job: Job): Promise<void> {
  const jobData = extractJobData(job);
  if (!jobData) {
    throw new Error(`Job ${job.id}: missing generationId or semestreId`);
  }

  const { generationId, semestreId } = jobData;

  // Propager le contexte de trace depuis les headers du job
  const parentCtx = propagation.extract(context.active(), {
    traceparent: jobData.traceparent,
    tracestate: jobData.tracestate,
  });

  const tracer = trace.getTracer('takt-worker');
  const span = tracer.startSpan(
    'worker.job.generation',
    {
      attributes: {
        'job.id': job.id,
        'job.queue': 'generation',
        'generation.id': generationId,
        'semestre.id': semestreId,
      },
    },
    parentCtx,
  );

  let lockRenewalStop: (() => void) | undefined;

  try {
    // ------------------------------------------------------------------
    // 1. Claim idempotent
    // ------------------------------------------------------------------
    const claimResult = await claimGenerationJob(
      generationId,
      semestreId,
      job.id,
    );
    if (!claimResult.claimed) {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      console.log(
        `Job ${job.id} claim rejected: ${claimResult.reason}. Skipping.`,
      );
      return; // Idempotent : pas de double traitement
    }

    // ------------------------------------------------------------------
    // 2. Guard : un seul job actif par semestre
    // ------------------------------------------------------------------
    const claimed = await claimGenerationForSemester(generationId, semestreId);
    if (!claimed) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `Another generation is active for semestre ${semestreId}`,
      });
      span.end();
      throw new Error(
        `Concurrent generation already active for semestre ${semestreId}`,
      );
    }

    // ------------------------------------------------------------------
    // 3. Renouvellement périodique du verrou pg-boss
    // ------------------------------------------------------------------
    lockRenewalStop = setupLockRenewal(job.id, 'generation');

    // ------------------------------------------------------------------
    // 4. Marquer RUNNING en base
    // ------------------------------------------------------------------
    await updateGenerationStatus(generationId, {
      statut: GenerationStatut.RUNNING,
      startedAt: new Date(),
    });

    span.setStatus({ code: SpanStatusCode.OK });

    // ------------------------------------------------------------------
    // 5. Logique de génération FET réelle (L4-08)
    //    - Construire le XML FET avec @takt/engine-fet
    //    - Lancer fet-cl en sous-processus isolé
    //    - Parser logs/result.txt et mettre à jour le statut
    // ------------------------------------------------------------------

    // Récupérer la génération depuis la base
    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
    });
    if (!generation) {
      throw new Error(`Generation ${generationId} introuvable`);
    }

    // Vérifier si une annulation a été demandée avant de commencer
    if (generation.cancelRequested) {
      await updateGenerationStatus(generationId, {
        statut: GenerationStatut.CANCELLED,
        finishedAt: new Date(),
      });
      return;
    }

    // Instancier l'adaptateur FET
    const fetAdapter = new FetAdapter();

    // Construire EngineInput à partir des données du semestre
    // NOTE : Le mapping complet Prisma → EngineInput doit être affiné
    // lorsque les modèles de données nécessaires sont disponibles.
    const engineInput = await buildEngineInputFromSemestre(semestreId);

    // Construire le fichier moteur (buildProfile)
    const engineFile = await fetAdapter.buildProfile(engineInput);

    // Archiver le fichier moteur et enregistrer sa version
    await updateGenerationStatus(generationId, {
      engineVersion: engineFile.engineVersion,
    });

    // Préparer les options d'exécution
    const durationLimit = 900; // défaut 15 min, à remplacer par la valeur du profil
    const seeds = generateRandomSeeds();

    const opts: EngineRunOptions = {
      timelimitSeconds: durationLimit,
      randomSeeds: seeds,
      verbose: false,
      writeTimetables: true,
      writeConflicts: true,
    };

    // Stocker les graines pour traçabilité (si le champ existait)
    // À activer quand le champ seeds sera ajouté au schéma Prisma

    // Créer un AbortSignal lié à la demande d'annulation
    const abortController = new AbortController();

    // Surveiller cancelRequested pendant l'exécution (polling toutes les 2s)
    const cancelPoll = setInterval(async () => {
      const fresh = await prisma.generation.findUnique({
        where: { id: generationId },
        select: { cancelRequested: true },
      });
      if (fresh?.cancelRequested && !abortController.signal.aborted) {
        abortController.abort();
      }
    }, 2000);

    try {
      // Lancer fet-cl
      const rawResult = await fetAdapter.run(engineFile, opts, abortController.signal);

      // Mettre à jour le statut selon le résultat
      await finalizeGeneration(
        generationId,
        rawResult,
        engineFile,
        seeds,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'exécution FET';
      await updateGenerationStatus(generationId, {
        statut: GenerationStatut.FAILED,
        finishedAt: new Date(),
        erreur: errorMessage,
      });
      throw err;
    } finally {
      clearInterval(cancelPoll);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: errorMessage,
    });

    // Vérifier si on doit envoyer en dead-letter après cette tentative
    const attempts = (job as any).attempts ?? 0;
    const nextAttempt = attempts + 1;

    if (isDeadLetter(nextAttempt)) {
      await handleDeadLetter(
        {
          id: job.id,
          data: job.data as Record<string, unknown>,
          attempts: nextAttempt,
        },
        err instanceof Error ? err : new Error(errorMessage),
      );
    }

    // Marquer la génération comme FAILED si elle existe
    try {
      await updateGenerationStatus(generationId, {
        statut: GenerationStatut.FAILED,
        finishedAt: new Date(),
        erreur: errorMessage,
      });
    } catch (updateErr) {
      console.error(
        `Failed to mark generation ${generationId} as FAILED:`,
        updateErr,
      );
    }

    throw err; // Rejeter pour que pg-boss gère le retry ou le dead-letter
  } finally {
    if (lockRenewalStop) {
      lockRenewalStop();
    }
    span.end();
  }
}

/**
 * Construit un EngineInput à partir des données du semestre.
 *
 * NOTE : Ce mapping est un squelette. Le mapping complet doit être affiné
 * lorsque les modèles de données nécessaires (créneaux, activités, salles, etc.)
 * sont disponibles dans le schéma Prisma.
 */
async function buildEngineInputFromSemestre(semestreId: string): Promise<import('@takt/contracts').EngineInput> {
  // Récupérer les affectations du semestre avec leurs relations
  const affectations = await prisma.affectation.findMany({
    where: { repartition: { semestreId } },
    include: {
      enseignant: true,
      groupe: true,
      module: true,
      typeEnseignement: true,
      activityTag: true,
      repartition: {
        include: { departement: true },
      },
    },
  });

  // Construire les enseignants uniques
  const teachersMap = new Map<string, { id: string; code: string }>();
  for (const a of affectations) {
    if (!teachersMap.has(a.enseignantId)) {
      teachersMap.set(a.enseignantId, {
        id: a.enseignantId,
        code: a.enseignant.matricule ?? a.enseignantId,
      });
    }
  }

  // Construire les groupes uniques
  const groupsMap = new Map<string, { id: string; code: string; size: number }>();
  for (const a of affectations) {
    if (a.groupeId && !groupsMap.has(a.groupeId)) {
      groupsMap.set(a.groupeId, {
        id: a.groupeId,
        code: a.groupe?.code ?? a.groupeId,
        size: 0, // À renseigner depuis les données réelles
      });
    }
  }

  // Construire les activités à partir des affectations
  const activities: import('@takt/contracts').EngineActivity[] = affectations.map((a, _idx) => ({
    id: a.id,
    code: a.module.code,
    subject: a.module.code,
    activityTagIds: a.activityTagId ? [a.activityTagId] : [],
    teacherIds: [a.enseignantId],
    groupIds: a.groupeId ? [a.groupeId] : [],
    roomTagIds: [],
    durationInSlots: Math.ceil(a.dureeMinutes / 30),
    minRooms: 1,
    maxRooms: 1,
  }));

  // Construire les périodes à partir des affectations (heuristique : une période par affectation)
  // À remplacer par une vraie grille de créneaux depuis le semestre
  const periods: import('@takt/contracts').EnginePeriod[] = affectations.map((a, idx) => ({
    id: `periode-${a.id}`,
    dayIndex: idx % 5, // Lundi=0 … Vendredi=4
    slotIndex: Math.floor(idx / 5),
    startTime: '08:00',
    endTime: '08:30',
  }));

  // Récupérer les salles disponibles (à affiner)
  const rooms: import('@takt/contracts').EngineRoom[] = [];
  const activityTags: import('@takt/contracts').EngineActivityTag[] = affectations
    .filter((a): a is typeof a & { activityTagId: string; activityTag: { code: string } } =>
      Boolean(a.activityTagId) && Boolean(a.activityTag),
    )
    .map((a) => ({
      id: a.activityTagId,
      code: a.activityTag.code,
    }));

  const constraints: import('@takt/contracts').EngineConstraint[] = [];
  const locks: import('@takt/contracts').EngineLock[] = [];

  return {
    semesterId: semestreId,
    periods,
    activities,
    teachers: Array.from(teachersMap.values()),
    groups: Array.from(groupsMap.values()),
    rooms,
    activityTags,
    constraints,
    locks,
  };
}

/**
 * Génère 6 graines MRG32k3a aléatoires pour fet-cl.
 */
function generateRandomSeeds(): [number, number, number, number, number, number] {
  const buf = randomBytes(24);
  return [
    buf.readUInt32BE(0) % 4_294_967_086 || 1,
    buf.readUInt32BE(4) % 4_294_967_086 || 1,
    buf.readUInt32BE(8) % 4_294_967_086 || 1,
    buf.readUInt32BE(12) % 4_294_944_442 || 1,
    buf.readUInt32BE(16) % 4_294_944_442 || 1,
    buf.readUInt32BE(20) % 4_294_944_442 || 1,
  ];
}

/**
 * Finalise une génération en fonction du résultat brut de fet-cl.
 * Met à jour le statut de la génération en base.
 */
async function finalizeGeneration(
  generationId: string,
  rawResult: EngineRawResult,
  _engineFile: EngineFile,
  _seeds: [number, number, number, number, number, number],
): Promise<void> {
  const { exitCode, resultText, activitiesTimetableXml } = rawResult;

  // Déterminer le statut à partir du résultat
  let statut: GenerationStatut;
  let erreur: string | null = null;

  const trimmed = resultText.trim();
  if (trimmed.includes('Generation successful')) {
    statut = activitiesTimetableXml
      ? GenerationStatut.SUCCEEDED
      : GenerationStatut.SUCCEEDED_WITH_WARNINGS;
  } else if (trimmed.includes('Impossible')) {
    statut = GenerationStatut.FAILED;
    erreur = 'Génération impossible : aucune solution complète trouvée';
  } else if (trimmed.includes('Time exceeded')) {
    statut = GenerationStatut.TIMED_OUT;
    erreur = 'Délai de génération dépassé';
  } else if (trimmed.includes('Generation interrupted')) {
    statut = GenerationStatut.CANCELLED;
    erreur = 'Génération interrompue par l\'utilisateur';
  } else if (exitCode === 1) {
    statut = GenerationStatut.FAILED;
    erreur = `Erreur FET (code 1): ${trimmed}`;
  } else if (exitCode < 0 || exitCode > 128) {
    statut = GenerationStatut.FAILED;
    erreur = `Processus FET tué ou planté (code ${exitCode})`;
  } else {
    statut = GenerationStatut.FAILED;
    erreur = `Statut FET non reconnu: ${trimmed}`;
  }

  await updateGenerationStatus(generationId, {
    statut,
    finishedAt: new Date(),
    erreur,
  });
}
