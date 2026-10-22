// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête de liste des séances (L3-11)
import { IsUUID, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SeanceStatut, JourSemaine } from '@takt/db';

// ============================================
// Seance (L3-11)
// GET /versions/{id}/seances — filtres et pagination
// ============================================

export class SeanceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: SeanceStatut })
  @IsOptional()
  @IsEnum(SeanceStatut)
  statut?: SeanceStatut;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jour?: JourSemaine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  affectationKey?: string;
}

export class PaginatedSeancesDto {
  @ApiProperty({ type: [Object] })
  data: any[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
