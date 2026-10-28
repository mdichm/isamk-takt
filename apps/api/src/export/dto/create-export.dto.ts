// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création d'un job d'export (L6-04)
import { IsString, IsOptional, IsObject, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat, ExportMode, GrilleAffichage } from '@takt/db';

/**
 * Corps de requête de POST /exports.
 * Déclare un job d'export asynchrone. Les versions du style et de la vue sont
 * résolues (dernière version active) si non spécifiées, puis figées dans l'ExportJob.
 */
export class CreateExportDto {
  @ApiProperty({
    description: 'Identifiant de la version d\'emploi du temps à exporter',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  versionId: string;

  @ApiPropertyOptional({
    description:
      'Identifiant du modèle visuel d\'export (dernière version active si omis)',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  styleId?: string;

  @ApiPropertyOptional({
    description:
      'Identifiant de la configuration de vue d\'export (dernière version active si omis)',
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  viewId?: string;

  @ApiProperty({
    enum: ExportFormat,
    description: 'Format du fichier à générer',
    example: 'PDF',
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    enum: ExportMode,
    description: 'Mode d\'export : brouillon (version non publiée) ou officiel (PUBLIEE/ARCHIVE)',
    example: 'BROUILLON',
  })
  @IsEnum(ExportMode)
  mode: ExportMode;

  @ApiPropertyOptional({
    enum: GrilleAffichage,
    default: GrilleAffichage.NORMALE,
    description: 'Grille d\'affichage (normale ou Ramadan)',
    example: 'NORMALE',
  })
  @IsOptional()
  @IsEnum(GrilleAffichage)
  grille?: GrilleAffichage;

  @ApiProperty({
    description:
      'Paramètres de périmètre : identifiants des objets à inclure dans l\'export',
    example: { departementIds: ['DEP-01'], groupeIds: [] },
  })
  @IsObject()
  parametres: Record<string, unknown>;
}
