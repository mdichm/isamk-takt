// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de mise à jour d'ExportStyle (L6-02)
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateExportStyleDto {
  @ApiPropertyOptional({ description: 'Libellé du style' })
  @IsString()
  @IsOptional()
  libelle?: string;

  @ApiPropertyOptional({ description: 'Configuration JSON (logos, en-tête, pied de page, couleurs, orientation, format, éléments affichés)' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Style actif' })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}