// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO pour les coefficients de charge par type d'enseignement (L2-03)

import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChargeCoefficientDto {
  @ApiProperty({ description: 'ID du type d\'enseignement' })
  @IsUUID()
  typeId: string;

  @ApiProperty({ example: 1.5, description: 'Coefficient de charge pour ce type' })
  @IsNumber()
  @Min(0)
  coefficient: number;
}

export class ChargeCoefficientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rulesetId: string;

  @ApiProperty()
  typeId: string;

  @ApiProperty()
  coefficient: number;

  @ApiProperty()
  createdAt: Date;

  constructor(data: {
    id: string;
    rulesetId: string;
    typeId: string;
    coefficient: number;
    createdAt: Date;
  }) {
    this.id = data.id;
    this.rulesetId = data.rulesetId;
    this.typeId = data.typeId;
    this.coefficient = data.coefficient;
    this.createdAt = data.createdAt;
  }
}
