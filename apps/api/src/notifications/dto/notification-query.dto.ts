// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de requête de la boîte de réception (L5-23 notif_api)

import { IsOptional, IsIn, IsInt, IsPositive, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Filtres et pagination de la boîte de notifications.
 * Pagination par curseur (limit + cursor = id de la dernière notification vue).
 * Le filtre `lu` accepte 'true' ou 'false' (string, converti dans le service).
 */
export class NotificationQueryDto {
  @ApiPropertyOptional({
    example: 'false',
    description: "Filtrer par état de lecture : 'true' (lues) ou 'false' (non lues). Absent = toutes.",
  })
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  lu?: string;

  @ApiPropertyOptional({ default: 50, description: 'Nombre de notifications par page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Curseur de pagination (id de la dernière notification déjà vue)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
