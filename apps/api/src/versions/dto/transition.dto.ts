// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de demande de transition de workflow (L5-01)
// POST /versions/{id}/transitions
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TransitionType } from '@takt/contracts';

// ============================================
// Transition de version (L5-01)
// ============================================

export class TransitionDto {
  @ApiProperty({
    enum: [
      'DEMARRER_EDITION',
      'MARQUER_PRET',
      'SOUMETTRE',
      'REPRENDRE',
      'RESOUMETTRE',
      'ABANDONNER',
    ],
    description: "Action de workflow à exécuter sur la version",
  })
  action: TransitionType;

  @ApiPropertyOptional({
    example: 'Prête pour validation',
    description: 'Motif ou commentaire de la transition (facultatif, utilisé par ABANDONNER)',
  })
  @IsOptional()
  @IsString()
  commentaire?: string;
}
