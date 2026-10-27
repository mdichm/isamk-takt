// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse ExportStyle (L6-02)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportStyleResponseDto {
  @ApiProperty({ description: 'Identifiant du style' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Code unique du style' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Numéro de version du style' })
  @IsNumber()
  styleVersion: number;

  @ApiProperty({ description: 'Libellé du style' })
  @IsString()
  libelle: string;

  @ApiProperty({ description: 'Configuration JSON du style' })
  config: Record<string, unknown>;

  @ApiProperty({ description: 'Style actif' })
  @IsBoolean()
  actif: boolean;

  @ApiPropertyOptional({ description: 'Date à laquelle le style a été utilisé pour la première fois' })
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

export class PaginatedExportStylesDto {
  @ApiProperty({ description: 'Liste des styles', type: [ExportStyleResponseDto] })
  data: ExportStyleResponseDto[];

  @ApiProperty({ description: 'Nombre total de styles' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Taille de page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}