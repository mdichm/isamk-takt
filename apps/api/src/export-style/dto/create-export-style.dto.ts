// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création d'ExportStyle (L6-02)
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExportStyleDto {
  @ApiProperty({ description: 'Code unique du style (ex. "DEFAULT", "OFFICIEL")' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Numéro de version du style', default: 1 })
  @Type(() => Number)
  @IsOptional()
  styleVersion?: number;

  @ApiProperty({ description: 'Libellé du style' })
  @IsString()
  libelle: string;

  @ApiProperty({ description: 'Configuration JSON (logos, en-tête, pied de page, couleurs, orientation, format, éléments affichés)' })
  @IsObject()
  config: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Style actif', default: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}