// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête pour la liste des ExportStyle (L6-02)
import { IsString, IsOptional, IsBoolean, IsInt, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ExportStyleQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Filtrer par libellé' })
  @IsString()
  @IsOptional()
  libelle?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @ApiPropertyOptional({ description: 'Page actuelle', default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({ description: 'Taille de page', default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  limit?: number;
}