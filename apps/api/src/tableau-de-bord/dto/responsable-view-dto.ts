// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de la vue Responsable (L5-26, EX-TDB-02)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RepartitionDto } from './repartition-dto.js';

// ============================================
// Vue Responsable (L5-26)
// ============================================

export class ChargeEnseignantAlerteDto {
  @ApiProperty({ description: 'Identifiant de l enseignant' })
  @IsString()
  enseignantId: string;

  @ApiProperty({ description: 'Nom de l enseignant' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Charge calculée (heures)' })
  @IsString()
  charge: string;

  @ApiProperty({ description: 'Seuil de référence (heures)' })
  @IsString()
  seuil: string;

  @ApiProperty({ description: 'True si dépassement de seuil' })
  @IsString()
  depassement: string;
}

export class ResponsableViewDto {
  @ApiProperty({ type: [RepartitionDto], description: 'Répartitions du département du Responsable' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepartitionDto)
  repartitions: RepartitionDto[];

  @ApiProperty({ type: [ChargeEnseignantAlerteDto], description: 'Charges des enseignants avec alertes de dépassement' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChargeEnseignantAlerteDto)
  charges: ChargeEnseignantAlerteDto[];

  @ApiPropertyOptional({ description: 'Validations à donner par le Responsable', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  validations?: string[];

  @ApiPropertyOptional({ description: 'Demandes ouvertes du département', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  demandes?: string[];
}
