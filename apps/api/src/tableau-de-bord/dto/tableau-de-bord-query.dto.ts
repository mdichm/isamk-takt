// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête du tableau de bord (L5-26)
// GET /tableau-de-bord?semestreId=&actions=

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

// ============================================
// Requête : tableau de bord (L5-26)
// ============================================

export class TableauDeBordQueryDto {
  @ApiPropertyOptional({
    description: 'Identifiant du semestre (UUID). Si omis, le semestre actif est utilisé.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional({
    description: 'Si "all", retourne la liste complète des actions prioritaires (au-delà des 5 par défaut)',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  actions?: string;
}
