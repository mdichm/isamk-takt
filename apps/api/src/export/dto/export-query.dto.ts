// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête pour la liste des jobs d'export (L6-04)
import { IsString, IsOptional, IsInt, IsPositive as IsPos, Min, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatut, ExportFormat, ExportMode } from '@takt/db';

/**
 * Filtres et pagination pour GET /exports.
 */
export class ExportQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPos()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @IsPos()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: JobStatut })
  @IsOptional()
  @IsEnum(JobStatut)
  statut?: JobStatut;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({ enum: ExportMode })
  @IsOptional()
  @IsEnum(ExportMode)
  mode?: ExportMode;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  versionId?: string;
}
