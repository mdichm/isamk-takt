// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête d'audit métier (Consultation de l'audit, L0-18)

import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Filtres de consultation de l'audit métier.
 * Filtres supportés : objetType, objetId, userId, from, to.
 * Pagination par curseur (limit + cursor).
 */
export class AuditQueryDto {
  @ApiPropertyOptional({
    example: 'User',
    description: 'Filtre par type d\'objet audité',
  })
  @IsOptional()
  @IsString()
  objetType?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtre par identifiant d\'objet audité (UUID)',
  })
  @IsOptional()
  @IsUUID()
  objetId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtre par identifiant de l\'utilisateur ayant déclenché l\'action',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00Z',
    description: 'Date/heure de début du filtre (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59Z',
    description: 'Date/heure de fin du filtre (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 50, description: 'Nombre d\'entrées par page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Curseur de pagination (ID de la dernière entrée vue)' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/** Réponse paginée d'entrées d'audit */
export class PaginatedAuditDto {
  @ApiPropertyOptional({ type: [Object] })
  data: any[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor: string | null;
}
