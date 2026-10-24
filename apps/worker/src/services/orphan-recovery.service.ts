// SPDX-License-Identifier: AGPL-3.0-only
// Service de reprise des jobs orphelins sans doublon
// Conforme ST §4.6.4 : "Redémarrage du worker en cours de job : job non acquitté réaffecté après expiration du verrou pg-boss, repris depuis le début.
// Garde d'idempotence : UPDATE ... WHERE statut IN ('QUEUED','RUNNING') AND startedAt < now() - interval"

import { prisma } from '@takt/db';
import { GenerationStatut } from '@takt/db';

// Seuil après lequel une génération RUNNING sans activité est considérée orpheline (ms)
const ORPHAN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
// Intervalle de scan pour les jobs orphelins (ms)
const SCAN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Résultat de la récupération des orphelins.
 */
export interface OrphanRecoveryResult {
  recovered: number;
  generationIds: string[];
}

/**
 * Recherche les générations orphelines (RUNNING depuis trop longtemps sans finishedAt)
 * et les remet en QUEUED pour qu'elles soient reprises par le worker.
 *
 * L'opération est idempotente : seules les générations qui remplissent les critères
 * sont modifiées, et aucune n'est traitée deux fois.
 *
 * @returns nombre de générations récupérées et leurs IDs
 */
export async function recoverOrphanJobs(): Promise<OrphanRecoveryResult> {
  const threshold = new Date(Date.now() - ORPHAN_THRESHOLD_MS);

  // Récupère les IDs des générations orphelines avant mise à jour
  const orphans = await prisma.generation.findMany({
    where: {
      statut: GenerationStatut.RUNNING,
      startedAt: {
        lt: threshold,
      },
      finishedAt: null,
    },
    select: { id: true, semestreId: true, statut: true, startedAt: true },
  });

  if (orphans.length === 0) {
    return { recovered: 0, generationIds: [] };
  }

  // Remet en QUEUED avec startedAt null pour reprise par le worker
  const generationIds = orphans.map((o) => o.id);
  await prisma.generation.updateMany({
    where: {
      id: { in: generationIds },
      statut: GenerationStatut.RUNNING,
      startedAt: { lt: threshold },
      finishedAt: null,
    },
    data: {
      statut: GenerationStatut.QUEUED,
      startedAt: null,
    },
  });

  console.log(
    `Orphan recovery: ${generationIds.length} generation(s) remise(s) en QUEUED: ${generationIds.join(', ')}`,
  );

  return { recovered: generationIds.length, generationIds };
}

/**
 * Démarre un scan périodique des jobs orphelins.
 * Retourne une fonction d'arrêt.
 *
 * @param intervalMs - intervalle de scan (ms, défaut 2 min)
 * @returns fonction pour arrêter le scan
 */
export function startOrphanRecoveryScan(
  intervalMs: number = SCAN_INTERVAL_MS,
): () => void {
  const interval = setInterval(async () => {
    try {
      await recoverOrphanJobs();
    } catch (err) {
      console.error('Orphan recovery scan failed:', err);
    }
  }, intervalMs);

  // Scan immédiat au démarrage
  void recoverOrphanJobs();

  return () => clearInterval(interval);
}

/**
 * Vérifie si une génération spécifique est orpheline.
 *
 * @param generationId - ID de la génération
 * @returns true si orpheline, false sinon
 */
export async function isOrphan(generationId: string): Promise<boolean> {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    select: {
      statut: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  if (!generation) return false;
  if (generation.finishedAt) return false;
  if (generation.statut !== GenerationStatut.RUNNING) return false;
  if (!generation.startedAt) return false;

  return Date.now() - generation.startedAt.getTime() > ORPHAN_THRESHOLD_MS;
}
