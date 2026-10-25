// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de relance d'une génération (L4-24)
// POST /generations/{id}/relancer -> 200

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { GenerationStatut, GenerationMode } from '@takt/db';

// ============================================
// Réponse de relance d'une génération (L4-24)
// ============================================

export class RelancerGenerationResponseDto {
  @ApiProperty({ description: 'Identifiant de la nouvelle génération créée' })
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
