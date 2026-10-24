// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête de comparaison de générations (L4-18)
// GET /generations/compare?ids=

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
  IsOptional,
} from 'class-validator';

// ============================================
// Comparaison de générations (L4-18)
// ============================================

export class CompareQueryDto {
  @ApiProperty({
    description:
      'Identifiants des générations à comparer (2 à 4 UUID, répétés)',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    isArray: true,
    minItems: 2,
    maxItems: 4,
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Au moins 2 identifiants de génération sont requis' })
  @ArrayMaxSize(4, { message: 'Au plus 4 identifiants de génération sont autorisés' })
  @IsUUID('4', { each: true, message: 'Chaque identifiant doit être un UUID valide' })
  ids: string[];
}
