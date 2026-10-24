// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de détail d'une génération (L4-15)
// GET /generations/{id} -> 200

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { GenerationStatut } from '@takt/db';

// ============================================
// Détail d'une génération (L4-15)
// ============================================

export class FichierMoteurInfoDto {
  @ApiProperty({ description: 'Empreinte SHA-256 du fichier moteur' })
  @IsString()
  sha256: string;

  @ApiProperty({ description: 'Version de FET utilisée' })
  @IsString()
  engineVersion: string;

  @ApiPropertyOptional({ description: 'URL signée courte pour télécharger le fichier' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Date de création de l\'enregistrement' })
  @IsOptional()
  @IsDate()
  createdAt?: Date;
}

export class GenerationDetailResponseDto {
  @ApiProperty({ description: 'Identifiant de la génération' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Identifiant de la version concernée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Identifiant du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ enum: GenerationStatut, description: 'Statut de la génération' })
  statut: GenerationStatut;

  @ApiPropertyOptional({ description: 'Date et heure de début d\'exécution' })
  @IsOptional()
  @IsDate()
  startedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Date et heure de fin d\'exécution' })
  @IsOptional()
  @IsDate()
  finishedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Durée d\'exécution en secondes' })
  @IsOptional()
  durationSeconds?: number | null;

  @ApiPropertyOptional({ description: 'Message d\'erreur en cas d\'échec' })
  @IsOptional()
  @IsString()
  erreur?: string | null;

  @ApiPropertyOptional({ description: 'Métriques d\'exécution (progression, score, etc.)' })
  @IsOptional()
  metrics?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Annulation demandée par l\'utilisateur' })
  @IsOptional()
  cancelRequested?: boolean;

  @ApiPropertyOptional({ description: 'Informations sur le fichier moteur (si disponible)' })
  @IsOptional()
  fichierMoteur?: FichierMoteurInfoDto | null;

  @ApiProperty({ description: 'Date et heure de mise en file d attente' })
  @IsDate()
  queuedAt: Date;

  @ApiProperty({ description: 'Date et heure de création de l enregistrement' })
  @IsDate()
  createdAt: Date;
}