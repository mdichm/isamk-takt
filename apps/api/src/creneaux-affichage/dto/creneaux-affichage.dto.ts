// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs de la correspondance d'affichage Ramadan (L1-22)
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// eslint-disable-next-line no-restricted-imports
import { GrilleAffichage } from '@takt/db';

// ============================================
// Correspondance d'affichage Ramadan (L1-22)
// ============================================

export class CreateCreneauAffichageDto {
  @ApiProperty({ example: 'uuid-creneau', description: 'ID du créneau logique' })
  @IsUUID()
  creneauId: string;

  @ApiProperty({ example: '07:30:00', description: 'Heure de début Ramadan (HH:MM:SS)' })
  @IsString()
  heureDebut: string;

  @ApiProperty({ example: '09:00:00', description: 'Heure de fin Ramadan (HH:MM:SS)' })
  @IsString()
  heureFin: string;
}

export class UpdateCreneauAffichageDto {
  @ApiPropertyOptional({ example: '07:30:00', description: 'Heure de début Ramadan (HH:MM:SS)' })
  @IsOptional()
  @IsString()
  heureDebut?: string;

  @ApiPropertyOptional({ example: '09:00:00', description: 'Heure de fin Ramadan (HH:MM:SS)' })
  @IsOptional()
  @IsString()
  heureFin?: string;
}

export class CreneauAffichageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creneauId: string;

  @ApiProperty({ enum: GrilleAffichage })
  grille: GrilleAffichage;

  @ApiProperty()
  heureDebut: string;

  @ApiProperty()
  heureFin: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// Liste paginée (L1-22)
// ============================================

export class CreneauxAffichageQueryDto {
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

  @ApiPropertyOptional({ enum: GrilleAffichage })
  @IsOptional()
  @IsEnum(GrilleAffichage)
  grille?: GrilleAffichage;
}

export class PaginatedCreneauxAffichagesDto {
  @ApiProperty({ type: [CreneauAffichageResponseDto] })
  data: CreneauAffichageResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ============================================
// Duplication de la correspondance Ramadan (L1-22)
// ============================================

export class DuplicateCreneauxAffichageDto {
  @ApiProperty({ example: 'uuid-source-semestre', description: 'ID du semestre source' })
  @IsUUID()
  sourceSemestreId: string;

  @ApiProperty({ example: 'uuid-cible-semestre', description: 'ID du semestre cible' })
  @IsUUID()
  cibleSemestreId: string;

  @ApiPropertyOptional({ example: false, description: 'Remplacer les correspondances existantes du cible' })
  @IsOptional()
  @IsBoolean()
  remplacer?: boolean;
}

export class DuplicateCreneauxAffichageResponseDto {
  @ApiProperty({ example: 8, description: 'Nombre de correspondances dupliquées' })
  created: number;

  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'], description: 'IDs des correspondances créées' })
  creneauAffichageIds: string[];
}
