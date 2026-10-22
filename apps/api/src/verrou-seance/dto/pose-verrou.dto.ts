// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de pose d'un verrou de séance (L3-36)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { VerrouType } from '@takt/db';

/**
 * Données requises pour poser un verrou sur une séance.
 */
export class PoseVerrouDto {
  @ApiProperty({
    enum: ['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'],
    description: 'Type de verrou à poser',
  })
  @IsEnum(['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'])
  type: VerrouType;

  @ApiPropertyOptional({
    example: 'Réservation salle pour examen final',
    description: 'Justification facultative de la pose',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  justification?: string;
}
