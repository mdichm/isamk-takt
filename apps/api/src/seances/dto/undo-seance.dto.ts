// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'annulation d'une modification de séance (L3-24)
// PATCH /seances/{id}/undo — annule le dernier déplacement en restaurant la position précédente.

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Données d'entrée pour annuler le dernier déplacement d'une séance.
 * Aucun champ requis : l'état précédent est déterminé depuis la dernière entrée d'audit.
 * Un motif optionnel peut être fourni pour l'audit.
 */
export class UndoSeanceDto {
  @ApiPropertyOptional({
    example: 'Annulation du dernier déplacement',
    description: 'Motif facultatif de l\'annulation',
  })
  @IsOptional()
  @IsString()
  motif?: string;
}
