// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de contexte du tableau de bord (L5-26)

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// ============================================
// Contexte (L5-26)
// ============================================

export class ContexteDto {
  @ApiProperty({ description: 'Année scolaire active', example: '2026-2027' })
  @IsString()
  annee: string;

  @ApiProperty({ description: 'Semestre actif', example: 'S1' })
  @IsString()
  semestre: string;
}
