// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création d'un jeu de règles de charge (L2-03)

import {
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PeriodeRegleValues = ['HEBDOMADAIRE', 'SEMESTRIELLE', 'ANNUELLE'] as const;
export type PeriodeRegle = (typeof PeriodeRegleValues)[number];

export class CreateChargeRuleSetDto {
  @ApiProperty({ example: 1, description: 'Numéro du jeu de règles de charge' })
  @IsInt()
  @Min(1)
  numero: number;

  @ApiProperty({
    enum: PeriodeRegleValues,
    description: 'Période du jeu de règles',
  })
  @IsIn(PeriodeRegleValues)
  periode: PeriodeRegle;

  @ApiPropertyOptional({
    example: 1200,
    description: "Seuil d'alerte (en minutes)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  seuil?: number;

  @ApiPropertyOptional({
    example: 2400,
    description: 'Plafond (en minutes)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  plafond?: number;

  @ApiPropertyOptional({
    example: 30,
    description: "Arrondi (en minutes, multiple de 30)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  arrondi?: number;

  @ApiPropertyOptional({
    description: "ID de l'année universitaire à laquelle le jeu est rattaché",
  })
  @IsOptional()
  @IsUUID()
  anneeId?: string;
}
