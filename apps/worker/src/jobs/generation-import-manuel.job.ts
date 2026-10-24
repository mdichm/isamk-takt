// SPDX-License-Identifier: AGPL-3.0-only
// Consumer pg-boss pour l'import manuel de résultat FET (L4-16)
// Lit un fichier résultat FET uploadé, construit un EngineInput depuis le périmètre,
// et appelle importGenerationResult pour créer les GenerationSeance et finaliser la génération.

import type { Job } from 'pg-boss';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { prisma } from '@takt/db';
import type { Prisma } from '@takt/db';
import { GenerationStatut } from '@takt/db';
import { FetAdapter } from '@takt/engine-fet';
import type { EngineActivity, EngineInput, EnginePeriod, EngineRawResult, EngineRoom, EngineActivityTag } from '@takt/contracts';
import { importGenerationResult } from '../services/fet-result-import.service.js';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';

// Données attendues dans le job pg-boss pour un import manuel
interface GenerationImportManuelJobData {
  generationId: string;
  semestreId: string;
  versionId: string;
  filePath: string;
}

/**
 * Extrait les données de job à partir d'un objet Job pg-boss.
 */
function extractJobData(job: Job): GenerationImportManuelJobData | null {
  const data = job.data as Record<string, unknown>;
  const generationId = data.generationId as string | undefined;
  const semestreId = data.semestreId as string | undefined;
  const versionId = data.versionId as string | undefined;
  const filePath = data.filePath as string | undefined;

  if (!generationId || !semestreId || !versionId || !filePath) {
    return null;
  }

  return { generationId, semestreId, versionId, filePath };
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
  },
): Promise<void> {
  await prisma.generation.update({
    where: { id: generationId },
    data: updates,
  });
}

/**
 * Construit un EngineInput à partir des affectations du semestre.
 * Même mapping squelette que dans generation.job.ts.
 */
async function buildEngineInputFromSemestre(semestreId: string): Promise<EngineInput> {
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

  const teachersMap = new Map<string, { id: string; code: string }>();
  for (const a of affectations) {
    if (!teachersMap.has(a.enseignantId)) {
      teachersMap.set(a.enseignantId, {
        id: a.enseignantId,
        code: a.enseignant.matricule ?? a.enseignantId,
      });
    }
  }

  const groupsMap = new Map<string, { id: string; code: string; size: number }>();
  for (const a of affectations) {
    if (a.groupeId && !groupsMap.has(a.groupeId)) {
      groupsMap.set(a.groupeId, {
        id: a.groupeId,
        code: a.groupe?.code ?? a.groupeId,
        size: 0,
      });
    }
  }

  const activities: EngineActivity[] = affectations.map((a) => ({
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

  const periods: EnginePeriod[] = affectations.map((a, idx) => ({
    id: `periode-${a.id}`,
    dayIndex: idx % 5,
    slotIndex: Math.floor(idx / 5),
    startTime: '08:00',
    endTime: '08:30',
  }));

  const rooms: EngineRoom[] = [];
  const activityTags: EngineActivityTag[] = affectations
    .filter((a): a is typeof a & { activityTagId: string; activityTag: { code: string } } => Boolean(a.activityTagId) && Boolean(a.activityTag))
    .map((a) => ({
      id: a.activityTagId,
      code: a.activityTag.code,
    }));

  return {
    semesterId: semestreId,
    periods,
    activities,
    teachers: Array.from(teachersMap.values()),
    groups: Array.from(groupsMap.values()),
    rooms,
    activityTags,
    constraints: [],
    locks: [],
  };
}

// Types EngineInput importés depuis @takt/contracts (EngineActivity, EnginePeriod, EngineRoom, EngineActivityTag)

/**
 * Traite un job d'import manuel de résultat FET.
 *
 * Étapes :
 * 1. Lire le fichier uploadé depuis le disque
 * 2. Extraire le resultText (contenu du fichier)
 * 3. Déterminer le statut FET (succès / échec) depuis le resultText
 * 4. Construire l'EngineInput depuis le périmètre du semestre
 * 5. Appeler FetAdapter.importResult pour construire l'EngineSolution
 * 6. Appeler importGenerationResult pour créer les GenerationSeance et finaliser
 * 7. Nettoyer le fichier temporaire
 */
async function handleGenerationImportManuelJob(job: Job): Promise<void> {
  const tracer = trace.getTracer('takt-worker');
  const span = tracer.startSpan('worker.job.generation-import-manuel', {
    attributes: { 'job.id': job.id, 'job.queue': 'generation:import-manuel' },
  });

  const data = extractJobData(job);
  if (!data) {
    const err = new Error('Données de job invalides (générationId, semestreId, versionId, filePath requis)');
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    span.end();
    throw err;
  }

  const { generationId, semestreId, versionId, filePath } = data;

  try {
    // 1. Lire le fichier uploadé depuis le disque
    const fileContent = await readFile(filePath, 'utf-8');
    const trimmed = fileContent.trim();

    // 2. Construire un EngineRawResult à partir du contenu du fichier
    const rawResult: EngineRawResult = {
      exitCode: trimmed.includes('Generation successful') ? 0 : 1,
      resultText: fileContent,
      activitiesTimetableXml: undefined,
      timetableConflictsXml: undefined,
      highestXml: undefined,
      currentXml: undefined,
      stdout: '',
      stderr: '',
      durationMs: 0,
    };

    // 3. Construire l'EngineInput depuis le périmètre du semestre
    const engineInput = await buildEngineInputFromSemestre(semestreId);

    // 4. Appeler FetAdapter.importResult pour reconstruire l'EngineSolution
    const fetAdapter = new FetAdapter();
    const engineSolution = await fetAdapter.importResult(rawResult, engineInput);

    // 5. Appeler importGenerationResult pour créer les GenerationSeance et finaliser
    await importGenerationResult(
      generationId,
      engineSolution,
      engineInput,
      versionId,
      { exitCode: rawResult.exitCode, resultText: rawResult.resultText, durationMs: rawResult.durationMs },
    );

    // 6. Métriques finales
    const placedCount = engineSolution.placedActivities.length;
    const totalCount = engineSolution.unplacedActivities.length + placedCount;
    await updateGenerationStatus(generationId, {
      metrics: {
        phase: 'DONE',
        elapsedSeconds: 0,
        placed: placedCount,
        total: totalCount,
      } as Prisma.InputJsonValue,
    });

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l import manuel';
    await updateGenerationStatus(generationId, {
      statut: GenerationStatut.FAILED,
      finishedAt: new Date(),
      erreur: errorMessage,
    });

    span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
    throw err;
  } finally {
    // 7. Nettoyer le fichier temporaire
    try {
      await rm(filePath, { force: true });
      const dir = join(filePath, '..');
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    } catch {
      // Ignorer les erreurs de nettoyage
    }
    span.end();
  }
}

export { handleGenerationImportManuelJob };