// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'une action prioritaire (L5-26)

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// ============================================
// Action prioritaire (L5-26)
// ============================================

export class ActionPrioritaireDto {
  @ApiProperty({ description: 'Code de la règle d action prioritaire' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cause / raison de l action' })
  @IsString()
  pourquoi: string;

  @ApiProperty({ description: 'Lien direct vers l écran de correction ou de consultation' })
  @IsString()
  lien: string;
}
