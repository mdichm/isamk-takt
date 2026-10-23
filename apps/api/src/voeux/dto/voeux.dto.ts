// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs des voeux enseignants (L3-33)
import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { ContrainteNature, JourSemaine } from '@takt/db';

// ============================================
// Constantes de poids pour les voeux (EX-CTR-03)
// ============================================

export const VOEU_POIDS_VALUES = [25, 50, 75, 90] as const;
export type VOEU_POIDS = (typeof VOEU_POIDS_VALUES)[number];

export const VOEU_CODES = [
  'TEACHER_AVOID_SLOT',
  'TEACHER_DAY_OFF_WISH',
  'TEACHER_DAYS_PER_WEEK',
  'TEACHER_HOURS_PER_DAY',
  'TEACHER_GAPS',
] as const;
export type VOEU_CODE = (typeof VOEU_CODES)[number];

// ============================================
// VOEU - DTOs
// ============================================

export class VoeuResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ description: 'ID de l\'enseignant cible' })
  enseignantId: string;

  @ApiProperty({ enum: VOEU_CODES, description: 'Type de vœu' })
  code: VOEU_CODE;

  @ApiProperty({ description: 'Paramètres du vœu (JSON)' })
  params: Record<string, unknown>;

  @ApiProperty({ enum: [25, 50, 75, 90], description: 'Poids du vœu (25, 50, 75 ou 90)' })
  poids: number;

  @ApiPropertyOptional({ description: 'Avertissement si le vœu contredit une indisponibilité' })
  avertissement?: string;

  @ApiPropertyOptional({ description: 'Commentaire libre' })
  commentaire?: string;

  @ApiProperty()
  actif: boolean;

  @ApiProperty()
  creePar: string;

  @ApiProperty()
  creeLe: Date;
}

export class CreateVoeuDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'uuid-enseignant', description: 'ID de l\'enseignant cible' })
  @IsUUID()
  enseignantId: string;

  @ApiProperty({ enum: VOEU_CODES, description: 'Type de vœu' })
  @IsIn(VOEU_CODES)
  code: VOEU_CODE;

  @ApiProperty({ description: 'Paramètres du vœu (JSON)' })
  params: Record<string, unknown>;

  @ApiProperty({ enum: [25, 50, 75, 90], description: 'Poids du vœu (25, 50, 75 ou 90)' })
  @IsInt()
  @Min(0)
  @Max(100)
  poids: number;

  @ApiPropertyOptional({ description: 'Commentaire libre' })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateVoeuDto {
  @ApiPropertyOptional({ description: 'Paramètres du vœu (JSON)' })
  @IsOptional()
  params?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: [25, 50, 75, 90], description: 'Poids du vœu (25, 50, 75 ou 90)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  poids?: number;

  @ApiPropertyOptional({ description: 'Commentaire libre' })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class VoeuQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par semestre' })
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}