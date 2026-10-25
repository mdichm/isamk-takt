// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de nouvelle révision (L5-10)
// POST /versions/{id}/new-revision

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Réponse de nouvelle révision (L5-10)
// ============================================

export class NewRevisionResponseDto {
  @ApiProperty({ description: 'Identifiant de la version enfant créée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ example: '1.1', description: 'Numéro de la version enfant (majeur.mineur, mineur incrémenté par RC-04)' })
  @IsString()
  numero: string;

  @ApiProperty({ enum: ['EDITION'], description: 'Statut de la version enfant après création' })
  @IsString()
  statut: VersionStatut;

  @ApiPropertyOptional({ description: 'Identifiant de la version parente publiée' })
  @IsUUID()
  @IsOptional()
  parentId: string | null;

  @ApiProperty({ description: 'Date et heure de création de la révision' })
  at: Date;
}
