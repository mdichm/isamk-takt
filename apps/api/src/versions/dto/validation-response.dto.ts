// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de décision de validation (L5-04)
// POST /versions/{id}/validations
import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DecisionDepartement } from '@takt/contracts';

// ============================================
// Sortie : décision de validation d'un département (L5-04)
// ============================================

export class ValidationResponseDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ example: '1.0', description: 'Numéro de version' })
  @IsString()
  versionNumero: string;

  @ApiProperty({ description: 'Identifiant du département' })
  @IsUUID()
  departementId: string;

  @ApiProperty({
    enum: ['EN_ATTENTE', 'APPROUVE', 'REJETE'],
    description: 'Décision enregistrée',
  })
  decision: DecisionDepartement;

  @ApiPropertyOptional({ description: 'Motif de la décision' })
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiProperty({ description: 'Décision prise par l Administrateur' })
  @IsBoolean()
  parAdministrateur: boolean;

  @ApiProperty({
    description: "Unanimite atteinte : tous les departments ont decide",
  })
  @IsBoolean()
  unanimiteAtteinte: boolean;

  @ApiPropertyOptional({
    description: 'Nouveau statut de la version si unanimite atteinte',
  })
  @IsOptional()
  @IsString()
  nouveauStatutVersion?: string;

  @ApiPropertyOptional({ description: 'Horodatage de la décision' })
  @IsOptional()
  at?: Date;
}
