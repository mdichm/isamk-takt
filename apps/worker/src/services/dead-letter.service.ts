// SPDX-License-Identifier: AGPL-3.0-only
// Service de file d'échecs (dead-letter) après 3 tentatives + alerte
// Conforme ST §4.6.4 : "File d'échecs après 3 tentatives, alerte" et §4.19 cas 5

import { prisma } from '@takt/db';
import { GenerationStatut } from '@takt/db';

// Nombre de tentatives avant mise en file d'échecs
const MAX_ATTEMPTS = 3;

/**
 * Résultat de traitement d'un job en échec.
 */
export interface DeadLetterResult {
  jobId: string;
  queue: string;
  attempts: number;
  error?: string;
  generationId?: string;
}

/**
 * Traite un job qui a échoué après le nombre maximal de tentatives.
 * Met à jour la génération associée en statut FAILED et consigne l'erreur.
 *
 * @param job - job pg-boss en échec
 * @param error - erreur qui a causé l'échec final
 * @returns résultat du traitement
 */
export async function handleDeadLetter(
  job: { id: string; data: Record<string, unknown>; attempts?: number },
  error?: Error,
): Promise<DeadLetterResult> {
  const jobData = job.data as Record<string, unknown>;
  const generationId = jobData.generationId as string | undefined;
  const attempts = job.attempts ?? 0;

  let generationUpdated = false;

  if (generationId) {
    try {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          statut: GenerationStatut.FAILED,
          finishedAt: new Date(),
          erreur: error
            ? `Échec après ${attempts} tentative(s): ${error.message}`
            : `Échec après ${attempts} tentative(s)`,
        },
      });
      generationUpdated = true;
    } catch (err) {
      console.error(
        `Failed to update generation ${generationId} to FAILED:`,
        err,
      );
    }
  }

  const result: DeadLetterResult = {
    jobId: job.id,
    queue: 'generation',
    attempts,
    error: error?.message,
    generationId,
  };

  // Alerte : log structuré pour le système de monitoring (Prometheus/Grafana)
  console.error(
    JSON.stringify({
      event: 'DEAD_LETTER',
      queue: 'generation',
      jobId: job.id,
      generationId,
      attempts,
      error: error?.message ?? 'unknown',
      timestamp: new Date().toISOString(),
      generationUpdated,
    }),
  );

  return result;
}

/**
 * Vérifie si un job a atteint le nombre maximal de tentatives.
 *
 * @param attempts - nombre de tentatives effectuées
 * @returns true si le job doit aller en dead-letter
 */
export function isDeadLetter(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}
