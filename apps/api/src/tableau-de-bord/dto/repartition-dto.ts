// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de répartition par département (L5-26)

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// ============================================
// Répartition par département (L5-26)
// ============================================

export class RepartitionDto {
  @ApiProperty({ description: 'Code du département', example: 'INFO' })
  @IsString()
  departementCode: string;

  @ApiProperty({
    enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'],
    description: 'Statut de la répartition',
  })
  @IsString()
  statut: string;

  @ApiProperty({ description: 'Avancement (n/m)', example: '12/12' })
  @IsString()
  avancement: string;
}
