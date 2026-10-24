// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du rapport de traduction FET (L4-06)
import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Rapport de traduction FET (L4-06)
// ============================================

export const MappingStatutValues = {
  TRADUITE: 'TRADUITE' as const,
  PARTIELLE: 'PARTIELLE' as const,
  NON_TRADUITE: 'NON_TRADUITE' as const,
} as const;

export type MappingStatut = 'TRADUITE' | 'PARTIELLE' | 'NON_TRADUITE';

export class FetMappingItemDto {
  @ApiProperty({ description: 'Code de la règle de contrainte' })
  regleCode: string;

  @ApiProperty({
    enum: ['TRADUITE', 'PARTIELLE', 'NON_TRADUITE'],
    description: 'Statut de traduction vers FET',
  })
  statut: MappingStatut;

  @ApiPropertyOptional({
    description: 'Raison explicite (requise pour PARTIELLE)',
  })
  @IsOptional()
  @IsString()
  raison?: string;

  @ApiProperty({
    description: 'La règle est contrôlée par l\'application (non traduite dans le fichier FET)',
  })
  @IsBoolean()
  controleeParApplication: boolean;

  @ApiPropertyOptional({ description: 'ID de la définition de contrainte' })
  @IsOptional()
  @IsUUID()
  definitionId?: string;
}

export class FetMappingStatsDto {
  @ApiProperty({ description: 'Nombre de règles traduites' })
  @IsInt()
  @Min(0)
  TRADUITE: number;

  @ApiProperty({ description: 'Nombre de règles partiellement traduites' })
  @IsInt()
  @Min(0)
  PARTIELLE: number;

  @ApiProperty({ description: 'Nombre de règles non traduites' })
  @IsInt()
  @Min(0)
  NON_TRADUITE: number;
}

export class FetMappingReportDto {
  @ApiProperty({ description: 'ID du semestre' })
  semestreId: string;

  @ApiProperty({ type: [FetMappingItemDto], description: 'Liste des items de traduction' })
  items: FetMappingItemDto[];

  @ApiProperty({ description: 'Nombre total de contraintes actives' })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({ type: FetMappingStatsDto, description: 'Répartition par statut' })
  stats: FetMappingStatsDto;
}

export class ContrainteFetMappingQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par statut de traduction' })
  @IsOptional()
  @IsIn(['TRADUITE', 'PARTIELLE', 'NON_TRADUITE'])
  statut?: MappingStatut;
}