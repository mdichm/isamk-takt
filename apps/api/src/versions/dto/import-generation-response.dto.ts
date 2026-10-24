// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'import de résultat manuel (L4-16)
// POST /versions/{id}/generations/import -> 202

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { GenerationMode } from '@takt/db';

// ============================================
// Réponse d'import de génération manuelle (L4-16)
// ============================================

export class ImportGenerationResponseDto {
  @ApiProperty({ description: 'Identifiant de la génération créée' })
  @IsUUID()
  generationId: string;

  @ApiProperty({ enum: GenerationMode, description: 'Mode de génération (MANUELLE)' })
  mode: GenerationMode;
}