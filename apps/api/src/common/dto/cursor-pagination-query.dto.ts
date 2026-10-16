// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de pagination par curseur (ST §3.1 : ?limit=50&cursor=... → { data, nextCursor }).

import { IsOptional, IsInt, Max, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number;

  @ApiPropertyOptional({ example: 'eyJpZCI6Ij...' })
  @IsOptional()
  @IsString({ message: 'Le curseur doit être une chaîne de caractères' })
  cursor?: string;
}
