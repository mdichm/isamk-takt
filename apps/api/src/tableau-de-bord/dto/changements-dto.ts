// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO des changements (L5-26)

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

// ============================================
// Changements (L5-26)
// ============================================

export class ChangementsDto {
  @ApiProperty({ description: 'Nombre de séances modifiées', example: 17 })
  @IsNumber()
  seancesModifiees: number;

  @ApiProperty({ description: 'Départements impactés', type: [String], example: ['INFO'] })
  @IsArray()
  @IsString({ each: true })
  departementsImpactes: string[];
}
