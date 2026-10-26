// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO du circuit de workflow figé (L5-19)
// EX-WFL-02 : les deux interrupteurs sont copiés sur la version à chaque
// SOUMETTRE / RESOUMETTRE ; un changement ultérieur du paramètre global ne
// touche pas un cycle déjà ouvert (ST §4.1.1).

import { ApiProperty } from '@nestjs/swagger';

/**
 * Circuit de workflow figé appliqué à une version.
 */
export class WorkflowCircuitDto {
  @ApiProperty({
    example: true,
    description: 'Validation du planning requise avant soumission',
  })
  validationPlanningRequise: boolean;

  @ApiProperty({
    example: true,
    description: 'Publication requise après validation de la version',
  })
  publicationRequise: boolean;
}
