// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de couverture/complétude (L3-30)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsString, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Couverture et complétude (L3-30)
// GET /versions/{id}/completude
// ============================================

export class CompletudeAffectationDto {
  @ApiProperty({ description: 'Clé d\'affectation (groupe:module:type:enseignant ou cm:module:type:enseignant)' })
  @IsString()
  affectationKey: string;

  @ApiProperty({ description: 'Nombre de séances attendues pour cette affectation' })
  @IsNumber()
  @Min(0)
  attendu: number;

  @ApiProperty({ description: 'Nombre de séances placées pour cette affectation' })
  @IsNumber()
  @Min(0)
  place: number;

  @ApiProperty({ description: 'Écart (attendu - placé)' })
  @IsNumber()
  ecart: number;
}

export class CompletudeResponseDto {
  @ApiProperty({ description: 'Nombre total de séances attendues' })
  @IsNumber()
  @Min(0)
  attenduTotal: number;

  @ApiProperty({ description: 'Nombre total de séances placées' })
  @IsNumber()
  @Min(0)
  placeTotal: number;

  @ApiProperty({ description: 'Écart total (attendu - placé)' })
  @IsNumber()
  ecartTotal: number;

  @ApiProperty({ description: 'Pourcentage de couverture (placé / attendu * 100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  couvertureTotale: number;

  @ApiProperty({ description: 'True si la couverture est exacte (écart = 0), condition nécessaire à PRET_POUR_VALIDATION' })
  @IsBoolean()
  couvertureExacte: boolean;

  @ApiProperty({ type: [CompletudeAffectationDto], description: 'Détail par affectation' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletudeAffectationDto)
  parAffectation: CompletudeAffectationDto[];
}
