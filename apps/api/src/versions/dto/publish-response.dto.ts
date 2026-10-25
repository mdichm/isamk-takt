// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de publication de version (L5-07)
// POST /versions/{id}/publish

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Réponse de publication (L5-07)
// ============================================

export class PublishResponseDto {
  @ApiProperty({ description: 'Identifiant de la version publiée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ example: '1.0', description: 'Numéro de version' })
  @IsString()
  numero: string;

  @ApiProperty({ enum: ['PUBLIE'], description: 'Statut de la version après publication' })
  @IsString()
  statut: VersionStatut;

  @ApiPropertyOptional({ description: 'Identifiant de la version précédente archivée' })
  @IsUUID()
  @IsOptional()
  versionPrecedenteId: string | null;

  @ApiPropertyOptional({ description: 'Numéro de la version précédente archivée' })
  @IsString()
  @IsOptional()
  versionPrecedenteNumero: string | null;

  @ApiProperty({ description: 'Date et heure de publication' })
  at: Date;
}