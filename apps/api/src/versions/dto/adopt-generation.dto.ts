// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'adoption d'une génération (L4-19)
// POST /versions/{id}/adopt

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

// ============================================
// Adoption d'une génération (L4-19)
// ============================================

export class AdoptGenerationDto {
  @ApiProperty({
    description: 'Identifiant de la génération à adopter',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  generationId: string;
}
