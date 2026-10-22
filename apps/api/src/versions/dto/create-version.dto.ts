// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création de version (L3-09)
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Création de version (L3-09)
// ============================================

export class CreateVersionDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiPropertyOptional({
    example: 'Première version S1',
    description: 'Motif de création de la version',
  })
  @IsOptional()
  @IsString()
  motif?: string;
}
