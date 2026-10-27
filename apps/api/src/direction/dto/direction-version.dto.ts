// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de version publiée/archivée pour l'espace Direction (L5-29)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class DirectionVersionDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Numéro de la version (ex. "1.0", "2.1")' })
  @IsString()
  numero: string;

  @ApiProperty({ description: 'Statut de la version (VALIDE, PUBLIE ou ARCHIVE)' })
  @IsString()
  statut: string;
}
