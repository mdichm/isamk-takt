// SPDX-License-Identifier: AGPL-3.0-only
// Consumer pg-boss pour la file de génération FET
// Conforme ST §4.6.4, §4.6.5 : exécution isolée de fet-cl, import du résultat,
// reprise idempotente, garde d'un seul job par semestre.

import type { Job } from 'pg-boss';
import { trace, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import type { Prisma } from '@takt/db';
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
import type { EngineLock, EngineRunOptions, EngineRawResult, EngineFile } from '@takt/contracts';
import { importGenerationResult } from '../services/fet-result-import.service.js';
import { randomBytes, createHash } from 'crypto';
import { mkdtemp, mkdir, rm, writeFile, rename } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Données attendues dans le job pg-boss pour une génération
interface GenerationJobData {
  generationId: string;
  semestreId: string;
  traceparent?: string;
  tracestate?: string;
}

// Répertoire de stockage des fichiers moteurs (.fet) sur le worker
const ENGINE_FILE_STORAGE_DIR = process.env.ENGINE_FILE_STORAGE_DIR ?? join(tmpdir(), 'takt-engine-files');

// Intervalle d'écriture du fichier sigwrite et de mise à jour des métriques (ms)
const SIGWRITE_INTERVAL_MS = 30_000;

// Nombre d'activités totales attendu (mis à jour après buildProfile)
let totalActivitiesExpected = 0;

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
    metrics?: Prisma.InputJsonValue | undefined;
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

    // ------------------------------------------------------------------
    // Régénération partielle (L4-22) : lecture de preserverVerrous depuis
    // le profil de génération, puis construction des EngineLock depuis
    // les verrous de séance actifs de la version.
    // ------------------------------------------------------------------
    let locks: EngineLock[] = [];
    if (generation.profilGenerationId) {
      const profilGeneration = await prisma.profilGeneration.findUnique({
        where: { id: generation.profilGenerationId },
        select: { preserverVerrous: true },
      });
      const preserverVerrous = profilGeneration?.preserverVerrous ?? false;

      if (preserverVerrous && generation.versionId) {
        const verrous = await prisma.verrouSeance.findMany({
          where: {
            versionId: generation.versionId,
            leveLe: null,
          },
          include: {
            seance: {
              include: {
                creneauDebut: true,
                salle: true,
              },
            },
          },
        });

        // Indexer les affectations par affectationKey pour résoudre séance → activité
        const affectations = await prisma.affectation.findMany({
          where: { repartition: { semestreId } },
          select: {
            id: true,
            groupeId: true,
            moduleId: true,
            typeEnseignementId: true,
            enseignantId: true,
          },
        });
        const affectationByKey = new Map<string, string>();
        for (const a of affectations) {
          const key = `${a.groupeId ?? ''}:${a.moduleId}:${a.typeEnseignementId}:${a.enseignantId}`;
          affectationByKey.set(key, a.id);
        }

        locks = verrous
          .filter((v): v is Extract<typeof v, { seance: NonNullable<typeof v.seance> }> => Boolean(v.seance))
          .flatMap((v) => {
            const seance = v.seance!;
            const activityId = affectationByKey.get(seance.affectationKey);
            if (!activityId) {
              return [];
            }

            let periodId: string | undefined;
            let roomId: string | undefined;

            if (v.type === 'CRENEAU' || v.type === 'ACTIVITE') {
              periodId = seance.creneauDebutId ?? undefined;
            }
            if (v.type === 'SALLE' || v.type === 'ACTIVITE') {
              roomId = seance.salleId ?? undefined;
            }

            // Un verrou sans créneau ni salle n'est pas traduisible en FET
            if (!periodId && !roomId) {
              return [];
            }

            // ENSEIGNANT : pas d'EngineLock (contrôle applicatif, pas FET)
            return [{
              id: v.id,
              activityId,
              periodId,
              roomId,
              weight: 100,
            }];
          });
      }
    }

    // Instancier l'adaptateur FET
    const fetAdapter = new FetAdapter();

    // Construire EngineInput à partir des données du semestre
    // NOTE : Le mapping complet Prisma → EngineInput doit être affiné
    // lorsque les modèles de données nécessaires sont disponibles.
    const engineInput = await buildEngineInputFromSemestre(semestreId, locks);

    // Construire le fichier moteur (buildProfile)
    const engineFile = await fetAdapter.buildProfile(engineInput);

    // Nombre total d'activités attendues (pour le suivi de progression)
    totalActivitiesExpected = engineInput.activities.length;

    // ------------------------------------------------------------------
    // Archiver le fichier moteur (.fet) sur le worker + enregistrement FichierMoteur
    // ------------------------------------------------------------------
    await mkdir(ENGINE_FILE_STORAGE_DIR, { recursive: true });
    const sha256 = createHash('sha256').update(engineFile.payload).digest('hex');
    const storageFileName = `${generationId}.fet`;
    const storageFilePath = join(ENGINE_FILE_STORAGE_DIR, storageFileName);
    // Écrire dans un fichier temporaire puis renommer (écriture atomique)
    const tmpFilePath = storageFilePath + `.tmp.${Date.now()}`;
    await writeFile(tmpFilePath, engineFile.payload);
    await rename(tmpFilePath, storageFilePath);

    await prisma.fichierMoteur.create({
      data: {
        generationId,
        sha256,
        engineVersion: engineFile.engineVersion,
        builderVersion: engineFile.builderVersion,
        filePath: storageFilePath,
        mappingReport: engineFile.mappingReport as unknown as Prisma.InputJsonValue | undefined,
      },
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

    // Surveiller cancelRequested et écrire sigwrite + métriques de progression (polling toutes les 2s)
    let sigwriteCounter = 0;
    const startTime = Date.now();
    const cancelPoll = setInterval(async () => {
      // Écrire sigwrite à intervalle régulier (30s) pour signaler que le worker est vivant
      sigwriteCounter += 2;
      if (sigwriteCounter >= SIGWRITE_INTERVAL_MS / 2000) {
        sigwriteCounter = 0;
        try {
          await writeFile(
            join(ENGINE_FILE_STORAGE_DIR, `sigwrite-${generationId}`),
            `${Date.now()}\n`,
          );
        } catch {
          // Ignorer les erreurs d'écriture sigwrite
        }
      }

      // Vérifier l'annulation
      const fresh = await prisma.generation.findUnique({
        where: { id: generationId },
        select: { cancelRequested: true },
      });
      if (fresh?.cancelRequested && !abortController.signal.aborted) {
        abortController.abort();
      }

      // Mettre à jour les métriques de progression (phase + elapsedSeconds)
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      await updateGenerationStatus(generationId, {
        metrics: {
          phase: 'RUNNING',
          elapsedSeconds,
          placed: null,
          total: totalActivitiesExpected,
        } as Prisma.InputJsonValue,
      });
    }, 2000);

    try {
      // Lancer fet-cl
      const rawResult = await fetAdapter.run(engineFile, opts, abortController.signal);

      // Importer le résultat FET et créer les GenerationSeance (L4-09)
      const engineSolution = await fetAdapter.importResult(rawResult, engineInput);
      await importGenerationResult(
        generationId,
        engineSolution,
        engineInput,
        semestreId,
        { exitCode: rawResult.exitCode, resultText: rawResult.resultText, durationMs: rawResult.durationMs },
      );

      // Métriques finales : compter les activités placées
      const placedCount = engineSolution.placedActivities.length;
      const totalCount = engineSolution.unplacedActivities.length + placedCount;
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      await updateGenerationStatus(generationId, {
        metrics: {
          phase: 'DONE',
          elapsedSeconds,
          placed: placedCount,
          total: totalCount,
        } as Prisma.InputJsonValue,
      });
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
    // Nettoyer le fichier sigwrite de cette génération
    try {
      await rm(join(ENGINE_FILE_STORAGE_DIR, `sigwrite-${generationId}`), { force: true });
    } catch {
      // Ignorer
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
async function buildEngineInputFromSemestre(
  semestreId: string,
  locks: import('@takt/contracts').EngineLock[] = [],
): Promise<import('@takt/contracts').EngineInput> {
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

  // Construire les périodes à partir des créneaux actifs du semestre
  // (id = creneau.id pour que les locks de séance puissent y faire référence)
  const creneaux = await prisma.creneau.findMany({
    where: { semestreId, estActive: true },
    orderBy: [{ jour: 'asc' }, { ordre: 'asc' }],
  });

  const jourIndex: Record<string, number> = {
    LUNDI: 0,
    MARDI: 1,
    MERCREDI: 2,
    JEUDI: 3,
    VENDREDI: 4,
    SAMEDI: 5,
  };

  const periods: import('@takt/contracts').EnginePeriod[] = creneaux.map((c) => ({
    id: c.id,
    dayIndex: jourIndex[c.jour] ?? 0,
    slotIndex: c.ordre - 1,
    startTime: c.heureDebut.toISOString().substring(11, 16), // HH:MM
    endTime: c.heureFin.toISOString().substring(11, 16), // HH:MM
  }));

  // Récupérer les salles actives (id = salle.id pour que les locks de séance puissent y faire référence)
  const salles = await prisma.salle.findMany({
    where: { estActive: true },
  });

  const rooms: import('@takt/contracts').EngineRoom[] = salles.map((s) => ({
    id: s.id,
    code: s.code,
    capacity: s.capaciteMax,
    tagIds: [],
  }));

  const activityTags: import('@takt/contracts').EngineActivityTag[] = affectations
    .filter((a): a is typeof a & { activityTagId: string; activityTag: { code: string } } =>
      Boolean(a.activityTagId) && Boolean(a.activityTag),
    )
    .map((a) => ({
      id: a.activityTagId,
      code: a.activityTag.code,
    }));

  const constraints: import('@takt/contracts').EngineConstraint[] = [];

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
 * Construit les EngineLock à partir des verrous de séance actifs.
 *
 * Règles (ST §4.14, EX-VRR-01) :
 * - CRENEAU → verrou sur le créneau (periodId) uniquement
 * - SALLE → verrou sur la salle (roomId) uniquement
 * - ACTIVITE → verrou sur créneau ET salle (periodId + roomId)
 * - ENSEIGNANT → pas d'EngineLock (contrôle applicatif, pas FET)
 * - Un verrou sans créneau ni salle n'est pas traduisible en FET → ignoré
 * - Une séance sans affectation résolue → ignoré
 *
 * @param verrous - verrous de séance actifs (leveLe IS NULL) avec leur seance incluse
 * @param affectationByKey - index affectationKey → id d'activité
 * @returns EngineLock[] triés par id (déterministe)
 */
interface VerrouSeanceInput {
  readonly id: string;
  readonly type: 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE';
  readonly seance: {
    readonly affectationKey: string;
    readonly creneauDebutId: string | null;
    readonly salleId: string | null;
  } | null;
}

export function buildLocksFromVerrous(
  verrous: readonly VerrouSeanceInput[],
  affectationByKey: Map<string, string>,
): EngineLock[] {
  const locks: EngineLock[] = [];

  for (const v of verrous) {
    const seance = v.seance;
    if (!seance) {
      continue;
    }

    const activityId = affectationByKey.get(seance.affectationKey);
    if (!activityId) {
      continue;
    }

    let periodId: string | undefined;
    let roomId: string | undefined;

    if (v.type === 'CRENEAU' || v.type === 'ACTIVITE') {
      periodId = seance.creneauDebutId ?? undefined;
    }
    if (v.type === 'SALLE' || v.type === 'ACTIVITE') {
      roomId = seance.salleId ?? undefined;
    }

    // Un verrou sans créneau ni salle n'est pas traduisible en FET
    if (!periodId && !roomId) {
      continue;
    }

    // ENSEIGNANT : pas d'EngineLock (contrôle applicatif, pas FET)
    locks.push({
      id: v.id,
      activityId,
      periodId,
      roomId,
      weight: 100,
    });
  }

  return locks.sort((a, b) => a.id.localeCompare(b.id));
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
