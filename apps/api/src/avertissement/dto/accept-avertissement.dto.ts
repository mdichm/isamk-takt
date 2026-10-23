// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'acceptation d'un avertissement (L3-39)
// POST /versions/:versionId/avertissements:accept

import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Requête d'acceptation d'un avertissement (EX-CTR-07, ST §4.15).
 * L'acceptation se fait par signature de conflit ; elle est caduque si la
 * signature disparaît ou change après un recalcul des conflits.
 */
export class AcceptAvertissementDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Signature stable du conflit à accepter (computeSignature, ST §4.3)',
  })
  @IsUUID()
  signature: string;

  @ApiPropertyOptional({
    example: 'Conflit acceptable dans le cadre de cette répartition',
    description: 'Justification facultative de l acceptation',
  })
  @IsOptional()
  @IsString()
  justification?: string;
}
