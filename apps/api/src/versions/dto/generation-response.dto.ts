// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de création de génération (L4-14)
// POST /versions/{id}/generations -> 202

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { GenerationStatut, GenerationMode } from '@takt/db';

// ============================================
// Réponse de création de génération (L4-14)
// ============================================

export class GenerationResponseDto {
  @ApiProperty({ description: 'Identifiant de la génération créée' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Identifiant de la version concernée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Identifiant du semestre de la version' })
  @IsUUID()
  semestreId: string;

  @ApiPropertyOptional({
    description: 'Identifiant du profil de génération utilisé',
  })
  @IsOptional()
  @IsUUID()
  profilId?: string | null;

  @ApiProperty({ enum: GenerationStatut, description: 'Statut de la génération' })
  statut: GenerationStatut;

  @ApiProperty({ enum: GenerationMode, description: 'Mode de génération' })
  mode: GenerationMode;

  @ApiProperty({
    description: 'Empreinte SHA-256 du périmètre figé avec la génération',
  })
  @IsString()
  perimetreHash: string;

  @ApiProperty({ description: 'Date et heure de mise en file d attente' })
  @IsDate()
  queuedAt: Date;

  @ApiProperty({ description: 'Date et heure de création de l enregistrement' })
  @IsDate()
  createdAt: Date;
}
