// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO pour les coefficients de charge par grade (L2-03)

import { IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargeReferenceGradeDto {
  @ApiPropertyOptional({ description: 'ID du grade (optionnel : coefficient par défaut)' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({ example: 1.5, description: 'Coefficient de charge (prime sur celui du type)' })
  @IsNumber()
  @Min(0)
  coefficient: number;
}

export class ChargeReferenceGradeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rulesetId: string;

  @ApiPropertyOptional()
  gradeId: string | null;

  @ApiProperty()
  coefficient: number;

  @ApiProperty()
  createdAt: Date;

  constructor(data: {
    id: string;
    rulesetId: string;
    gradeId: string | null;
    coefficient: number;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.rulesetId = data.rulesetId;
    this.gradeId = data.gradeId;
    this.coefficient = data.coefficient;
    this.createdAt = data.createdAt;
  }
}
