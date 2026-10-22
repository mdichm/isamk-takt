// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de version (L3-09)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { VersionStatut } from '@takt/db';

// ============================================
// Version (L3-09)
// ============================================

export class VersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ example: '1.0', description: 'Numéro de version (majeur.mineur)' })
  numero: string;

  @ApiProperty({ enum: ['BROUILLON', 'EDITION', 'EN_VALIDATION', 'VALIDE', 'PUBLIE', 'ARCHIVE', 'CORRECTION'] })
  statut: VersionStatut;

  @ApiPropertyOptional({ description: 'Motif de création' })
  motif?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
