// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de déplacement d'une séance (L3-20)
// PATCH /seances/{id}/placement — déplacement avec contrôle optimiste et détection de conflits.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { JourSemaine } from '@takt/db';

/**
 * Données requises pour déplacer une séance sur un nouveau créneau/salle.
 */
export class MoveSeanceDto {
  @ApiProperty({
    enum: JourSemaine,
    description: 'Jour cible du placement',
  })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID du créneau de début cible',
  })
  @IsUUID()
  creneauDebutId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la salle cible',
  })
  @IsUUID()
  salleId: string;
}
