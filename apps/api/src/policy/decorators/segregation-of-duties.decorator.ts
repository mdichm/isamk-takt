// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Décorateur de séparation des tâches (L0-40)

import { SetMetadata } from '@nestjs/common';

/**
 * Clé de métadonnées pour la séparation des tâches.
 */
export const SEGREGATION_OF_DUTIES_KEY = 'segregation_of_duties';

/**
 * Décorateur indiquant qu'un endpoint applique la règle de séparation des tâches.
 * Le champ spécifié désigne l'identifiant du soumetteur dans la requête.
 *
 * @param field Nom du champ contenant l'ID du soumetteur (body, params ou query)
 */
export function SegregationOfDuties(field: string): MethodDecorator {
  return SetMetadata(SEGREGATION_OF_DUTIES_KEY, field);
}
