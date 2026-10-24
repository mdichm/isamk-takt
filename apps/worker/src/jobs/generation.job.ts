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
    // 5. TODO: Logique de génération FET réelle (à implémenter dans L4-08/L4-09)
    //    - Construire le XML FET avec @takt/engine-fet
    //    - Lancer fet-cl en sous-processus isolé
    //    - Parser logs/result.txt et importer les séances
    // ------------------------------------------------------------------
    console.log(
      `Generation job ${job.id} for generation ${generationId} is running. FET execution logic not yet implemented (L4-08/L4-09).`,
    );

    // Pour l'instant, on marque comme SUCCEEDED (placeholder)
    await updateGenerationStatus(generationId, {
      statut: GenerationStatut.SUCCEEDED,
      finishedAt: new Date(),
    });
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
