// SPDX-License-Identifier: AGPL-3.0-only
// Guard: garantit un seul job de génération actif par semestre
// Conforme ST §4.6.4 : "Une génération par semestre à la fois"

import { prisma } from '@takt/db';
import { GenerationStatut } from '@takt/db';

/**
 * Vérifie qu'aucune génération n'est déjà en cours pour le semestre donné.
 * Utilise un verrou pessimiste sur la ligne Generation pour éviter les races.
 *
 * @param semestreId - UUID du semestre
 * @returns true si aucun job actif, false sinon
 * @throws {Error} si une erreur DB survient
 */
export async function assertSingleJobPerSemester(
  semestreId: string,
): Promise<boolean> {
  const now = new Date();

  // Recherche une génération RUNNING ou QUEUED avec startedAt récent (< 30 min)
  // pour considérer qu'un job est "actif" sur ce semestre
  const activeGeneration = await prisma.generation.findFirst({
    where: {
      semestreId,
      statut: {
        in: [GenerationStatut.QUEUED, GenerationStatut.RUNNING],
      },
      startedAt: {
        gte: new Date(now.getTime() - 30 * 60 * 1000),
      },
    },
    select: { id: true, statut: true, startedAt: true },
  });

  if (activeGeneration) {
    return false;
  }

  return true;
}

/**
 * Marque une génération comme RUNNING avec un startedAt.
 * Retourne false si une autre génération est déjà active (double-check).
 */
export async function claimGenerationForSemester(
  generationId: string,
  semestreId: string,
): Promise<boolean> {
  const now = new Date();

  const updated = await prisma.generation.updateMany({
    where: {
      id: generationId,
      semestreId,
      statut: GenerationStatut.QUEUED,
      // Double-check : aucun autre job actif sur ce semestre
      OR: [
        {
          statut: GenerationStatut.QUEUED,
          startedAt: {
            lt: new Date(now.getTime() - 30 * 60 * 1000),
          },
        },
        {
          statut: GenerationStatut.RUNNING,
          startedAt: {
            lt: new Date(now.getTime() - 30 * 60 * 1000),
          },
        },
      ],
    },
    data: {
      statut: GenerationStatut.RUNNING,
      startedAt: now,
    },
  });

  return updated.count > 0;
}
