// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'impact par département (L5-03)
// GET /versions/{id}/impact
import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImpactDepartementStatut } from '@takt/db';

// ============================================
// Entrée : impact d'un département (L5-03)
// ============================================

export class ImpactDepartementDto {
  @ApiProperty({ description: 'Identifiant du département' })
  @IsUUID()
  departementId: string;

  @ApiProperty({ example: 'INFO', description: 'Code du département' })
  @IsString()
  departementCode: string;

  @ApiProperty({ example: 'Informatique', description: 'Libellé du département' })
  @IsString()
  departementLibelle: string;

  @ApiProperty({
    enum: ImpactDepartementStatut,
    description: 'Statut d impact du département',
  })
  statut: ImpactDepartementStatut;

  @ApiProperty({
    example: 'SEANCES_MODIFIEES',
    description: 'Raison du statut d impact',
  })
  @IsString()
  raison: string;

  @ApiProperty({ description: 'Approbation reportee sur la version parente' })
  @IsBoolean()
  reportee: boolean;

  @ApiPropertyOptional({
    description: 'Identifiant de la version parente source du report',
  })
  @IsOptional()
  @IsUUID()
  cycleSource?: string;
}
