// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de la vue Direction (L5-26, EX-TDB-02)

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// ============================================
// Vue Direction (L5-26)
// ============================================

export class DirectionViewDto {
  @ApiProperty({ description: 'Version publiée par semestre', example: '2.0' })
  @IsString()
  versionPubliee: string;

  @ApiProperty({ description: 'Accès aux exports officiels', example: true })
  @IsString()
  exports: string;
}
