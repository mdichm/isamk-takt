// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de mise à jour d'ExportView (L6-03)
import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExportFormat } from '@takt/db';

export class UpdateExportViewDto {
  @ApiPropertyOptional({ description: 'Libellé de la vue' })
  @IsString()
  @IsOptional()
  libelle?: string;

  @ApiPropertyOptional({ description: 'Type de vue' })
  @IsString()
  @IsOptional()
  vue?: string;

  @ApiPropertyOptional({ description: 'Format d\'export (PDF ou XLSX)', enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiPropertyOptional({ description: 'Configuration JSON (colonnes, ordre, feuilles, regroupements)' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Vue active' })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}