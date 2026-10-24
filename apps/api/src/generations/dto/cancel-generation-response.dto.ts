// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'annulation de génération (L4-15)
// POST /generations/{id}/cancel -> 200

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsBoolean } from 'class-validator';

// ============================================
// Réponse d'annulation de génération (L4-15)
// ============================================

export class CancelGenerationResponseDto {
  @ApiProperty({ description: 'Identifiant de la génération annulée' })
  @IsUUID()
  generationId: string;

  @ApiProperty({ description: 'Statut mis à jour' })
  @IsString()
  statut: string;

  @ApiProperty({ description: 'Confirmation que l annulation a été demandée' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Indique si l annulation a été demandée' })
  @IsBoolean()
  cancelRequested: boolean;
}