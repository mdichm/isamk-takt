// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création d'occupation (L3-10)
import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RessourceType, JourSemaine } from '@takt/db';

export class CreateOccupationDto {
  @ApiProperty({ example: 'uuid-version', description: 'ID de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ example: 'uuid-seance', description: 'ID de la séance' })
  @IsUUID()
  seanceId: string;

  @ApiProperty({ example: 'LUNDI', description: 'Jour de la semaine', enum: JourSemaine })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({ example: 'uuid-creneau', description: 'ID du créneau' })
  @IsUUID()
  creneauId: string;

  @ApiProperty({ example: 'ENSEIGNANT', description: 'Type de ressource', enum: RessourceType })
  @IsEnum(RessourceType)
  ressourceType: RessourceType;

  @ApiProperty({ example: 'uuid-ressource', description: 'ID de la ressource' })
  @IsUUID()
  ressourceId: string;
}
