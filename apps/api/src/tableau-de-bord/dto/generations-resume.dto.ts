// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO des générations (L5-26)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { GenerationStatut } from '@takt/db';

// ============================================
// Générations (L5-26)
// ============================================

export class GenerationResumeDto {
  @ApiProperty({ description: 'Identifiant de la génération', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({
    enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'SUCCEEDED_WITH_WARNINGS', 'FAILED', 'CANCELLED', 'TIMED_OUT'],
    description: 'Statut de la génération',
  })
  @IsString()
  statut: GenerationStatut;

  @ApiPropertyOptional({ description: 'Date de création', example: '2026-10-26T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  creeLe?: string | null;
}

export class GenerationsResumeDto {
  @ApiProperty({ type: [GenerationResumeDto], description: 'Générations en cours' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerationResumeDto)
  enCours: GenerationResumeDto[];

  @ApiProperty({ type: [GenerationResumeDto], description: 'Générations récentes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenerationResumeDto)
  recentes: GenerationResumeDto[];
}
