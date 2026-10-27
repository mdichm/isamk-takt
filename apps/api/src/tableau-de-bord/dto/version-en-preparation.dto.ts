// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de la version en préparation (L5-26)

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Version en préparation (L5-26)
// ============================================

export class VersionEnPreparationDto {
  @ApiProperty({ description: 'Identifiant de la version', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: ['BROUILLON', 'EDITION', 'PRET_POUR_VALIDATION', 'EN_VALIDATION', 'VALIDE', 'PUBLIE', 'ARCHIVE', 'CORRECTION', 'REJETE'], description: 'Statut de la version' })
  @IsString()
  statut: VersionStatut;

  @ApiProperty({ description: 'Nombre de conflits bloquants', example: 0 })
  @IsNumber()
  conflitsBloquants: number;

  @ApiProperty({ description: 'Nombre de séances non placées', example: 0 })
  @IsNumber()
  nonPlacees: number;

  @ApiProperty({ description: 'Nombre d avertissements non acceptés', example: 3 })
  @IsNumber()
  avertissementsNonAcceptes: number;
}
