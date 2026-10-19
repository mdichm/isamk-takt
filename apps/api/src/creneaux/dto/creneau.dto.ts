// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du CRUD créneaux et pauses (L1-17)
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// eslint-disable-next-line no-restricted-imports
import { JourSemaine } from '@takt/db';

// ============================================
// Créneaux et pauses (L1-17)
// ============================================

export class CreateCreneauDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'LUNDI', enum: JourSemaine, description: 'Jour de la semaine' })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({ example: 1, description: 'Ordre du créneau dans la journée' })
  @IsInt()
  @Min(1)
  ordre: number;

  @ApiProperty({ example: '08:00:00', description: 'Heure de début (HH:MM:SS)' })
  @IsString()
  heureDebut: string;

  @ApiProperty({ example: '08:30:00', description: 'Heure de fin (HH:MM:SS)' })
  @IsString()
  heureFin: string;

  @ApiPropertyOptional({ example: false, description: 'Indique si c\'est une pause' })
  @IsOptional()
  @IsBoolean()
  estPause?: boolean;
}

export class UpdateCreneauDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordre?: number;

  @ApiPropertyOptional({ example: '08:30:00' })
  @IsOptional()
  @IsString()
  heureDebut?: string;

  @ApiPropertyOptional({ example: '09:00:00' })
  @IsOptional()
  @IsString()
  heureFin?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  estPause?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}

export class CreneauResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ enum: JourSemaine })
  jour: JourSemaine;

  @ApiProperty()
  ordre: number;

  @ApiProperty()
  heureDebut: string;

  @ApiProperty()
  heureFin: string;

  @ApiProperty()
  estPause: boolean;

  @ApiProperty()
  estActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// Duplication de créneaux (L1-19)
// ============================================

export class DuplicateCreneauxDto {
  @ApiProperty({ example: 'uuid-source-semestre', description: 'ID du semestre source' })
  @IsUUID()
  sourceSemestreId: string;

  @ApiProperty({ example: 'uuid-cible-semestre', description: 'ID du semestre cible' })
  @IsUUID()
  cibleSemestreId: string;

  @ApiPropertyOptional({ example: false, description: 'Remplacer les créneaux existants du cible' })
  @IsOptional()
  @IsBoolean()
  remplacer?: boolean;
}

export class DuplicateCreneauxResponseDto {
  @ApiProperty({ example: 8, description: 'Nombre de créneaux dupliqués' })
  created: number;

  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'], description: 'IDs des créneaux créés' })
  creneauIds: string[];
}

export class CreneauQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional({ enum: JourSemaine })
  @IsOptional()
  @IsEnum(JourSemaine)
  jour?: JourSemaine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estPause?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}

export class PaginatedCreneauxDto {
  @ApiProperty({ type: [CreneauResponseDto] })
  data: CreneauResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
