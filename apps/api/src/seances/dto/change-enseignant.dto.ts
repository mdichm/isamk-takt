// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de changement d'enseignant d'une séance (L3-22)
// PATCH /seances/{id}/enseignant — changement d'enseignant avec contrôle optimiste, bail, verrous et audit.

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Données requises pour changer l'enseignant d'une séance.
 */
export class ChangeEnseignantDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID du nouvel enseignant assigné à la séance',
  })
  @IsUUID()
  enseignantId: string;
}
