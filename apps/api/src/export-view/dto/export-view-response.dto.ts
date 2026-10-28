// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse ExportView (L6-03)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ExportFormat } from '@takt/db';

export class ExportViewResponseDto {
  @ApiProperty({ description: 'Identifiant de la vue' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Code unique de la vue' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Numéro de version de la vue' })
  @IsNumber()
  viewVersion: number;

  @ApiProperty({ description: 'Libellé de la vue' })
  @IsString()
  libelle: string;

  @ApiProperty({ description: 'Type de vue (groupe, enseignant, salle, ...)' })
  @IsString()
  vue: string;

  @ApiProperty({ description: 'Format d\'export', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Configuration JSON de la vue' })
  config: Record<string, unknown>;

  @ApiProperty({ description: 'Vue active' })
  @IsBoolean()
  actif: boolean;

  @ApiPropertyOptional({ description: 'Date à laquelle la vue a été utilisée pour la première fois' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  utiliseLe?: Date;

  @ApiProperty({ description: 'Date de création' })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}

export class PaginatedExportViewsDto {
  @ApiProperty({ description: 'Liste des vues', type: [ExportViewResponseDto] })
  data: ExportViewResponseDto[];

  @ApiProperty({ description: 'Nombre total de vues' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Taille de page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}