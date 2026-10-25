// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'erreur 422 VERSION_NOT_SUBMITTABLE (L5-02)
// POST /versions/{id}/transitions
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConflitResponseDto } from '../../conflit/dto/conflit-response.dto.js';

// ============================================
// Erreur 422 : version non soumettable (L5-02)
// ============================================

export class CouvertureIncompleteDto {
  @ApiProperty({ description: 'Clé d\'affectation (groupe:module:type:enseignant)' })
  @IsString()
  affectationKey: string;

  @ApiProperty({ description: 'Volume attendu en minutes (depuis le snapshot)' })
  @IsNumber()
  attenduMinutes: number;

  @ApiProperty({ description: 'Volume placé en minutes (somme des séances placées)' })
  @IsNumber()
  placeMinutes: number;

  @ApiProperty({ description: 'Écart (attendu - placé)' })
  @IsNumber()
  ecart: number;
}

export class VersionNotSubmittableDto {
  @ApiProperty({ example: 'VERSION_NOT_SUBMITTABLE', description: 'Code d\'erreur' })
  @IsString()
  code: string;

  @ApiProperty({ example: 422, description: 'Code HTTP' })
  @IsNumber()
  status: number;

  @ApiProperty({ type: [ConflitResponseDto], description: 'Conflits bloquants (sévérité BLOQUANT non résolus)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConflitResponseDto)
  conflits: ConflitResponseDto[];

  @ApiProperty({ type: [CouvertureIncompleteDto], description: 'Affectations avec couverture incomplète' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouvertureIncompleteDto)
  couverture: CouvertureIncompleteDto[];

  @ApiProperty({ example: 3, description: 'Nombre d\'avertissements non acceptés (ne bloquent pas)' })
  @IsNumber()
  avertissementsNonAcceptes: number;
}
