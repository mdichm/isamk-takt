// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'impact d'un changement de règle (L5-13)
// GET /contraintes/instances/{id}/impact-versions

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsArray, IsNumber } from 'class-validator';

// ============================================
// Impact d'un changement de règle (L5-13)
// ============================================

export class ImpacteVersionDto {
  @ApiProperty({ description: 'Identifiant de la version impactée' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Numéro de la version', example: '1.1' })
  @IsString()
  versionNumero: string;

  @ApiProperty({ description: 'Statut de la version' })
  @IsString()
  statut: string;

  @ApiProperty({ description: 'Raison de l impact sur cette version' })
  @IsString()
  raison: string;

  @ApiProperty({ description: 'Nombre de séances concernées dans cette version' })
  @IsNumber()
  nbSeances: number;
}

export class ContrainteInstanceImpactResponseDto {
  @ApiProperty({ description: 'Identifiant de l instance de contrainte' })
  @IsUUID()
  instanceId: string;

  @ApiProperty({ description: 'Code de la définition de contrainte' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Portée de la contrainte' })
  @IsString()
  portee: string;

  @ApiProperty({ type: [ImpacteVersionDto], description: 'Versions non publiées impactées' })
  @IsArray()
  versionsImpactees: ImpacteVersionDto[];

  @ApiProperty({ description: 'Nombre total de versions impactées' })
  @IsNumber()
  total: number;
}