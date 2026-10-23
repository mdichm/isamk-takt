// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de suggestions de résolution (L3-25)
// GET /seances/{id}/suggestions — lecture seule, max 20 alternatives.
import { IsOptional, IsInt, Min, Max, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JourSemaine, ConflitType, ConflitSeverite } from '@takt/db';

export class SuggestionConflitDto {
  @ApiProperty()
  regleCode: string;

  @ApiProperty({ enum: ConflitType })
  type: ConflitType;

  @ApiProperty({ enum: ConflitSeverite })
  severite: ConflitSeverite;

  @ApiProperty()
  message: string;

  @ApiProperty()
  signature: string;
}

export class SuggestionDto {
  @ApiProperty()
  jour: JourSemaine;

  @ApiProperty({ description: 'ID du créneau de début cible' })
  creneauDebutId: string;

  @ApiProperty({ description: 'ID de la salle cible' })
  salleId: string;

  @ApiProperty({ description: 'Nombre de conflits résolus par rapport à la position actuelle' })
  conflitsResolus: number;

  @ApiProperty({ description: 'Delta de score souple (après − avant)' })
  deltaScoreSouple: number;

  @ApiProperty({ description: 'Distance en minutes par rapport au créneau actuel' })
  distanceMinutes: number;

  @ApiProperty({ description: 'La salle est conservée (inchangée)' })
  salleConservee: boolean;

  @ApiProperty({ type: [SuggestionConflitDto] })
  conflitsResiduels: SuggestionConflitDto[];

  @ApiProperty({ description: 'Alternative enseignante proposée (enseignantId différent de l\'actuel)' })
  estAlternativeEnseignant: boolean;
}

export class SuggestionsResponseDto {
  @ApiProperty({ type: [SuggestionDto] })
  suggestions: SuggestionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ description: 'Durée de traitement en ms' })
  dureeMs: number;
}

export class SuggestionsQueryDto {
  @ApiPropertyOptional({ enum: JourSemaine, description: 'Jour cible' })
  @IsOptional()
  @IsEnum(JourSemaine)
  jour?: JourSemaine;

  @ApiPropertyOptional({ description: 'ID du créneau de début cible' })
  @IsOptional()
  @IsUUID()
  creneauDebutId?: string;

  @ApiPropertyOptional({ description: 'ID de la salle cible' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ description: 'ID enseignant pour alternatives d\'enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 20;
}
