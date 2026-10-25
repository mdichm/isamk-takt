// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de mise à jour des paramètres globaux du workflow (L5-17)
// PATCH /parametres/workflow

import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Données d'entrée pour mettre à jour les paramètres globaux du workflow.
 * Au moins un des deux interrupteurs doit être présent (validé au niveau service).
 */
export class WorkflowParamsUpdateDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Validation du planning requise avant soumission',
  })
  @IsOptional()
  @IsBoolean()
  validationPlanningRequise?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Publication requise après validation de la version',
  })
  @IsOptional()
  @IsBoolean()
  publicationRequise?: boolean;

  @ApiPropertyOptional({
    example: 'Passage en production',
    description: 'Motif facultatif de la modification',
  })
  @IsOptional()
  @IsString()
  motif?: string;
}
