// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de listage des générations d'une version (L4-21)
// GET /versions/{id}/generations -> 200

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import type { GenerationStatut } from '@takt/db';

// ============================================
// Élément de liste des générations d'une version (L4-21)
// ============================================

export class GenerationListItemDto {
  @ApiProperty({ description: 'Identifiant de la génération' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Nom de la version' })
  @IsString()
  versionNom: string;

  @ApiProperty({ enum: GenerationStatut, description: 'Statut de la génération' })
  statut: GenerationStatut;

  @ApiPropertyOptional({
    description: 'Score global de la génération (0-100)',
    type: Number,
  })
  @IsOptional()
  score?: number | null;

  @ApiPropertyOptional({
    description: 'La génération est classée (état SUCCEEDED avec score)',
  })
  @IsOptional()
  classee?: boolean | null;

  @ApiPropertyOptional({
    description: 'Classement de la génération parmi les générations classées',
    type: Number,
  })
  @IsOptional()
  classement?: number | null;

  @ApiPropertyOptional({
    description: 'Motif si la génération n est pas classée',
  })
  @IsOptional()
  @IsString()
  motifNonClassee?: string | null;

  @ApiProperty({ description: 'Date et heure de création' })
  @IsDate()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Date et heure de début d exécution' })
  @IsOptional()
  @IsDate()
  startedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Date et heure de fin d exécution' })
  @IsOptional()
  @IsDate()
  finishedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Durée d exécution en secondes' })
  @IsOptional()
  durationSeconds?: number | null;
}

export class GenerationListResponseDto {
  @ApiProperty({
    description: 'Liste des générations de la version',
    type: [GenerationListItemDto],
  })
  items: GenerationListItemDto[];

  @ApiProperty({ description: 'Nombre total de générations', type: Number })
  total: number;
}
