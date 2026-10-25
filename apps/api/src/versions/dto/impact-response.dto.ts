// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'analyse d'impact (L5-03)
// GET /versions/{id}/impact
import { IsString, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImpactDepartementDto } from './impact-departement.dto.js';

// ============================================
// Réponse : synthèse d'impact par département (L5-03)
// ============================================

export class ImpactResumeDto {
  @ApiProperty({ description: 'Nombre de départements impactés' })
  impactes: number;

  @ApiProperty({ description: 'Nombre de départements non impactés' })
  nonImpactes: number;

  @ApiProperty({
    description: 'Nombre de départements dont l approbation est reportee',
  })
  reportees: number;
}

export class ImpactResponseDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ example: '1.0', description: 'Numéro de version' })
  @IsString()
  versionNumero: string;

  @ApiProperty({
    description: 'Détail par département',
    type: [ImpactDepartementDto],
  })
  @IsArray()
  departements: ImpactDepartementDto[];

  @ApiProperty({ description: 'Synthèse des comptages' })
  resume: ImpactResumeDto;
}
