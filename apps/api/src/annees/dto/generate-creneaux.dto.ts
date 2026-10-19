// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs pour la génération de grille horaire (L1-18)
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// eslint-disable-next-line no-restricted-imports
import { JourSemaine } from '@takt/db';

// ============================================
// Sous-éléments d'entrée (L1-18)
// ============================================

export class PauseGenerationDto {
  @ApiProperty({ example: '10:00:00', description: 'Heure de début de la pause (HH:MM:SS)' })
  @IsString()
  debut: string;

  @ApiProperty({ example: '10:30:00', description: 'Heure de fin de la pause (HH:MM:SS)' })
  @IsString()
  fin: string;
}

export class JourGenerationDto {
  @ApiProperty({ example: 'LUNDI', enum: JourSemaine, description: 'Jour de la semaine' })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({ example: '08:00:00', description: 'Heure de début de la journée (HH:MM:SS)' })
  @IsString()
  heureDebut: string;

  @ApiProperty({ example: '12:00:00', description: 'Heure de fin de la journée (HH:MM:SS)' })
  @IsString()
  heureFin: string;

  @ApiPropertyOptional({ type: [PauseGenerationDto], description: 'Pauses de la journée' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PauseGenerationDto)
  pauses?: PauseGenerationDto[];
}

// ============================================
// Body de requete (L1-18)
// ============================================

export class GenerateCreneauxDto {
  @ApiProperty({
    type: [JourGenerationDto],
    description: 'Configuration par jour ouvré (heures de début/fin et pauses)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JourGenerationDto)
  jours: JourGenerationDto[];

  @ApiPropertyOptional({
    default: false,
    description: 'Si true, retourne uniquement le décompte sans écrire en base',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  dryRun?: boolean = false;
}

// ============================================
// Réponse (L1-18)
// ============================================

export class CreneauGenereDto {
  @ApiProperty({ enum: JourSemaine })
  jour: JourSemaine;

  @ApiProperty()
  ordre: number;

  @ApiProperty({ example: '08:00:00', description: 'Heure de début (HH:MM:SS)' })
  heureDebut: string;

  @ApiProperty({ example: '08:30:00', description: 'Heure de fin (HH:MM:SS)' })
  heureFin: string;

  @ApiProperty()
  estPause: boolean;
}

export class ParJourDto {
  @ApiProperty({ enum: JourSemaine })
  jour: JourSemaine;

  @ApiProperty()
  count: number;
}

export class GenerateCreneauxResponseDto {
  @ApiProperty()
  semestreId: string;

  @ApiProperty({ type: [CreneauGenereDto] })
  creneaux: CreneauGenereDto[];

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [ParJourDto] })
  parJour: ParJourDto[];
}