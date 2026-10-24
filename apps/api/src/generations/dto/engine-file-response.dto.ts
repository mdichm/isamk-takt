// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse pour le fichier moteur (L4-15)
// GET /generations/{id}/engine-file -> 200

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

// ============================================
// Réponse URL signée pour le fichier moteur (L4-15)
// ============================================

export class EngineFileResponseDto {
  @ApiProperty({ description: 'Identifiant de la génération' })
  @IsUUID()
  generationId: string;

  @ApiProperty({ description: 'URL signée courte pour télécharger le fichier .fet' })
  @IsString()
  downloadUrl: string;

  @ApiProperty({ description: 'Empreinte SHA-256 du fichier moteur' })
  @IsString()
  sha256: string;

  @ApiProperty({ description: 'Version de FET utilisée' })
  @IsString()
  engineVersion: string;

  @ApiPropertyOptional({ description: 'Date et heure d expiration de l URL signée' })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}