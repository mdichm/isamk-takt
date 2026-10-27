// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de résumé de préparation (L5-26)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

// ============================================
// Résumé de préparation (L5-26)
// ============================================

export class PreparationResumeDto {
  @ApiProperty({ description: 'Nombre d anomalies bloquantes', example: 0 })
  @IsNumber()
  bloquants: number;

  @ApiProperty({ description: 'Nombre d avertissements', example: 3 })
  @IsNumber()
  avertissements: number;

  @ApiPropertyOptional({
    description: 'Principales anomalies à corriger',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  principaux?: string[];
}
