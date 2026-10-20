// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'un jeu de règles de charge (L2-03)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeReferenceGradeResponseDto } from './charge-reference-grade.dto.js';
import { ChargeCoefficientResponseDto } from './charge-coefficient.dto.js';
export { CreateChargeRuleSetDto } from './create-charge-ruleset.dto.js';
export { UpdateChargeRuleSetDto } from './update-charge-ruleset.dto.js';

export class ChargeRuleSetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: number;

  @ApiProperty({ enum: ['HEBDOMADAIRE', 'SEMESTRIELLE', 'ANNUELLE'] })
  periode: string;

  @ApiPropertyOptional()
  seuil: number | null;

  @ApiPropertyOptional()
  plafond: number | null;

  @ApiPropertyOptional()
  arrondi: number | null;

  @ApiPropertyOptional()
  publieLe: Date | null;

  @ApiPropertyOptional()
  anneeId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [ChargeReferenceGradeResponseDto] })
  referenceGrades?: ChargeReferenceGradeResponseDto[];

  @ApiPropertyOptional({ type: [ChargeCoefficientResponseDto] })
  coefficients?: ChargeCoefficientResponseDto[];

  constructor(data: {
    id: string;
    numero: number;
    periode: string;
    seuil: number | null;
    plafond: number | null;
    arrondi: number | null;
    publieLe: Date | null;
    anneeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    referenceGrades?: Array<{
      id: string;
      rulesetId: string;
      gradeId: string | null;
      coefficient: number;
      createdAt: Date;
    }>;
    coefficients?: Array<{
      id: string;
      rulesetId: string;
      typeId: string;
      coefficient: number;
      createdAt: Date;
    }>;
  }) {
    this.id = data.id;
    this.numero = data.numero;
    this.periode = data.periode;
    this.seuil = data.seuil;
    this.plafond = data.plafond;
    this.arrondi = data.arrondi;
    this.publieLe = data.publieLe;
    this.anneeId = data.anneeId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.referenceGrades = data.referenceGrades?.map(
      (g) => new ChargeReferenceGradeResponseDto(g),
    );
    this.coefficients = data.coefficients?.map(
      (c) => new ChargeCoefficientResponseDto(c),
    );
  }
}
