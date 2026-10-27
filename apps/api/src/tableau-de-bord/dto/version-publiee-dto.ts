// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de la version publiée (L5-26)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

// ============================================
// Version publiée (L5-26)
// ============================================

export class VersionPublieeDto {
  @ApiProperty({ description: 'Numéro de la version publiée', example: '2.0' })
  @IsString()
  numero: string;

  @ApiProperty({ description: 'Date de publication', example: '2026-10-26T10:00:00Z' })
  @IsDateString()
  publieLe: string;

  @ApiPropertyOptional({ description: 'Provenance de la version publiée' })
  @IsOptional()
  provenance?: {
    generationId?: string | null;
    profil?: { code?: string | null; numero?: number | null; libelle?: string | null } | null;
    chargeRuleSet?: { code?: string; libelle?: string } | null;
    fet?: string | null;
    engineVersion?: string | null;
    builderVersion?: string | null;
  } | null;
}
