// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs de l'évaluateur de satisfaction des vœux (L3-35)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsUUID, IsIn } from 'class-validator';
import type { VOEU_CODE } from '../../voeux/dto/voeux.dto.js';

// ============================================
// VŒUX EVAL - DTOs
// ============================================

export class VoeuEvalDetailDto {
  @ApiProperty({ example: 'TEACHER_AVOID_SLOT' })
  @IsString()
  code: VOEU_CODE;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  sousScore: number | null;

  @ApiProperty({ enum: ['EVALUÉ', 'NON_EVALUE'], example: 'EVALUÉ' })
  @IsIn(['EVALUÉ', 'NON_EVALUE'])
  statut: 'EVALUÉ' | 'NON_EVALUE';

  @ApiProperty({ example: 'Vœu respecte sur ce placement' })
  @IsString()
  message: string;

  @ApiProperty({ example: 75 })
  @IsNumber()
  poids: number;
}

export class VoeuEvalScoreDto {
  @ApiProperty({ example: 78.5 })
  @IsNumber()
  score: number;

  @ApiProperty({ type: [VoeuEvalDetailDto] })
  @IsArray()
  details: VoeuEvalDetailDto[];

  @ApiProperty({ example: 'uuid-enseignant' })
  @IsUUID()
  enseignantId: string;

  @ApiProperty({ example: 'uuid-semestre' })
  @IsUUID()
  semestreId: string;
}

export class VoeuEvalDeltaDto {
  @ApiProperty({ example: 15.5 })
  @IsNumber()
  delta: number;

  @ApiProperty({ type: VoeuEvalScoreDto })
  avant: VoeuEvalScoreDto;

  @ApiProperty({ type: VoeuEvalScoreDto })
  apres: VoeuEvalScoreDto;

  @ApiProperty({ type: [VoeuEvalDetailDto] })
  @IsArray()
  details: VoeuEvalDetailDto[];
}

export class VoeuEvalQueryDto {
  @ApiPropertyOptional({ example: 'uuid-enseignant', description: 'ID de l enseignant cible' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ example: 'LUNDI', description: 'Jour du placement candidat' })
  @IsOptional()
  @IsString()
  jour?: string;

  @ApiPropertyOptional({ example: 'c1', description: 'Creneau de debut' })
  @IsOptional()
  @IsString()
  creneauDebut?: string;

  @ApiPropertyOptional({ example: 'salle-1', description: 'Salle cible' })
  @IsOptional()
  @IsString()
  salle?: string;

  @ApiPropertyOptional({ example: ['LUNDI|c6'], description: 'Plages a eviter (slotKeys)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plagesAEviter?: string[];

  @ApiPropertyOptional({ example: 1, description: 'Heures consecutives minimum' })
  @IsOptional()
  @IsNumber()
  heuresConsecutivesMin?: number;

  @ApiPropertyOptional({ example: 4, description: 'Heures consecutives maximum' })
  @IsOptional()
  @IsNumber()
  heuresConsecutivesMax?: number;
}
