// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'adoption d'une génération (L4-19)
// POST /versions/{id}/adopt -> 200

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Réponse d'adoption (L4-19)
// ============================================

export class AdoptResponseDto {
  @ApiProperty({ description: 'Identifiant de la version adoptée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({
    example: '2.0',
    description: 'Nouveau numéro de version (majeur.mineur, majeur incrémenté par RC-04)',
  })
  @IsString()
  numero: string;

  @ApiProperty({ enum: ['EDITION'], description: 'Statut de la version après adoption' })
  statut: VersionStatut;

  @ApiProperty({
    description:
      "Nombre de conflits initiaux recalculés sur la version après l'adoption",
    type: Number,
    example: 3,
  })
  @IsInt()
  conflitsInitiaux: number;
}
