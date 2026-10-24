// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de demande de création de génération (L4-14)
// POST /versions/{id}/generations

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

// ============================================
// Création de génération (L4-14)
// ============================================

export class CreateGenerationDto {
  @ApiProperty({
    description: 'Identifiant du profil de génération à utiliser',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  profilId: string;

  @ApiProperty({
    description:
      'Empreinte SHA-256 du périmètre affichée par GET /versions/{id}/perimetre',
    example: 'sha256:9c1f...',
  })
  @IsString()
  perimetreHash: string;

  @ApiPropertyOptional({
    description:
      'Acquittement explicite des contraintes non traduites par l adaptateur FET',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  acknowledgeUntranslatedConstraints?: boolean;
}
