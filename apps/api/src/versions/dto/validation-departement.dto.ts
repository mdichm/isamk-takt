// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de décision de validation par département (L5-04)
// POST /versions/{id}/validations
import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionDepartement } from '@takt/db';

// ============================================
// Entrée : décision de validation d'un département (L5-04)
// ============================================

export class ValidationDepartementDto {
  @ApiProperty({ description: 'Identifiant du département concerné' })
  @IsUUID()
  departementId: string;

  @ApiProperty({
    enum: DecisionDepartement,
    description: 'Décision du Responsable ou de l Administrateur',
  })
  decision: DecisionDepartement;

  @ApiPropertyOptional({
    description:
      'Motif de la décision (obligatoire en cas de rejet, facultatif sinon)',
  })
  @IsOptional()
  @IsString()
  motif?: string;
}
