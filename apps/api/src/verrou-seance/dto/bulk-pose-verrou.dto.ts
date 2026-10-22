// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO pour pose en masse de verrous (L3-37)

import { IsEnum, IsString, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { VerrouType } from '@takt/db';

export class BulkCibleDto {
  @IsEnum(['GROUPE', 'ENSEIGNANT', 'SALLE'])
  type: 'GROUPE' | 'ENSEIGNANT' | 'SALLE';

  @IsUUID()
  id: string;
}

export class BulkPoseVerrouDto {
  @ValidateNested()
  @Type(() => BulkCibleDto)
  cible: BulkCibleDto;

  @IsEnum(VerrouType)
  type: VerrouType;

  @IsOptional()
  @IsString()
  justification?: string;
}