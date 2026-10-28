// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création d'ExportView (L6-03)
import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExportFormat } from '@takt/db';

export class CreateExportViewDto {
  @ApiProperty({ description: 'Code unique de la vue (ex. "GROUPE", "ENSEIGNANT")' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Numéro de version de la vue', default: 1 })
  @Type(() => Number)
  @IsOptional()
  viewVersion?: number;

  @ApiProperty({ description: 'Libellé de la vue' })
  @IsString()
  libelle: string;

  @ApiProperty({ description: 'Type de vue (groupe, enseignant, salle, formation, département, globale, charges)' })
  @IsString()
  vue: string;

  @ApiProperty({ description: 'Format d\'export (PDF ou XLSX)', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Configuration JSON (colonnes, ordre, feuilles, regroupements)' })
  @IsObject()
  config: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Vue active', default: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}