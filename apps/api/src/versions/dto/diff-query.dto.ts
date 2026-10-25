// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de query du diff entre deux versions (L5-11)
// GET /versions/{id}/diff?against=

import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DiffQueryDto {
  @ApiProperty({
    description: 'Identifiant de la version de référence (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  against: string;
}