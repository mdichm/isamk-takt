// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs d'évaluation de contraintes souples (L3-27)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';

export class EvalDetailDto {
  @ApiProperty({ example: 'plagesAEviter' })
  @IsString()
  critere: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  sousScore: number | null;

  @ApiProperty({ enum: ['EVALUÉ', 'NON_EVALUE'], example: 'EVALUÉ' })
  @IsEnum(['EVALUÉ', 'NON_EVALUE'])
  statut: 'EVALUÉ' | 'NON_EVALUE';

  @ApiProperty({ example: 'Aucune plage à éviter impactée' })
  @IsString()
  message: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  poids: number;
}

export class EvalScoreDto {
  @ApiProperty({ example: 78.5 })
  @IsNumber()
  score: number;

  @ApiProperty({ type: [EvalDetailDto] })
  @IsArray()
  details: EvalDetailDto[];
}

export class EvalDeltaDto {
  @ApiProperty({ example: 15.5 })
  @IsNumber()
  delta: number;

  @ApiProperty({ type: EvalScoreDto })
  avant: EvalScoreDto;

  @ApiProperty({ type: EvalScoreDto })
  apres: EvalScoreDto;

  @ApiProperty({ type: [EvalDetailDto] })
  @IsArray()
  details: EvalDetailDto[];
}

export class EvalQueryDto {
  @ApiPropertyOptional({ example: 'seance-1' })
  @IsOptional()
  @IsString()
  seanceId?: string;

  @ApiPropertyOptional({ example: 'LUNDI' })
  @IsOptional()
  @IsString()
  jour?: string;

  @ApiPropertyOptional({ example: 'c1' })
  @IsOptional()
  @IsString()
  creneauDebut?: string;

  @ApiPropertyOptional({ example: 'salle-1' })
  @IsOptional()
  @IsString()
  salle?: string;

  @ApiPropertyOptional({ example: ['LUNDI|c6'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plagesAEviter?: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  heuresConsecutivesMin?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  heuresConsecutivesMax?: number;
}