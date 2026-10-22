// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'un conflit (L3-17)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConflitType, ConflitSeverite } from '@takt/db';

export class ConflitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  regleCode: string;

  @ApiProperty({ enum: ConflitType })
  type: ConflitType;

  @ApiProperty({ enum: ConflitSeverite })
  severite: ConflitSeverite;

  @ApiProperty()
  objetType: string;

  @ApiProperty()
  objetId: string;

  @ApiProperty({ type: [String] })
  seanceIds: string[];

  @ApiProperty()
  message: string;

  @ApiProperty()
  signature: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details?: Record<string, unknown>;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  resoluLe?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
