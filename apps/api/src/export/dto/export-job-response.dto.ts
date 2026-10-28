// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'un job d'export (L6-04)
import { IsString, IsOptional, IsDate, IsEnum, IsUUID, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExportFormat,
  ExportMode,
  GrilleAffichage,
  JobStatut,
} from '@takt/db';

/**
 * Représentation d'un ExportJob, y compris les versions figées du style et de la vue
 * pour permettre la régénération d'un export historique.
 */
export class ExportJobResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  styleId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  viewId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  auteurId: string;

  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ enum: ExportMode })
  @IsEnum(ExportMode)
  mode: ExportMode;

  @ApiProperty({ enum: GrilleAffichage })
  @IsEnum(GrilleAffichage)
  grille: GrilleAffichage;

  @ApiProperty({ description: 'Paramètres de périmètre de l export' })
  @IsObject()
  parametres: Record<string, unknown>;

  @ApiProperty({ enum: JobStatut })
  @IsEnum(JobStatut)
  statut: JobStatut;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  storageKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sha256?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erreur?: string;

  @ApiPropertyOptional({ description: 'Version du style figée au moment du job' })
  @IsOptional()
  styleVersion?: number;

  @ApiPropertyOptional({ description: 'Version de la vue figée au moment du job' })
  @IsOptional()
  viewVersion?: number;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'IDs des avertissements acceptés liés à ce job (pied de page, audit)',
  })
  @IsOptional()
  @IsArray()
  avertissementsAcceptes?: string[];

  @ApiPropertyOptional({
    enum: GrilleAffichage,
    description: 'Grille d\'affichage effective utilisée pour ce job (résolution : dto.grille > version.grilleFigée > NORMALE)',
  })
  @IsOptional()
  @IsEnum(GrilleAffichage)
  grilleEffective?: GrilleAffichage;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  finishedAt?: Date;
}
