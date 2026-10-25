// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse des paramètres globaux du workflow (L5-17)
// GET /parametres/workflow

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Paramètres globaux du workflow (ligne unique ParametreWorkflow, id = 1).
 */
export class WorkflowParamsResponseDto {
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

  @ApiProperty({
    example: '2026-10-25T10:00:00Z',
    description: 'Date de dernière modification',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de lutilisateur ayant effectué la dernière modification',
  })
  updatedBy: string | null;
}
