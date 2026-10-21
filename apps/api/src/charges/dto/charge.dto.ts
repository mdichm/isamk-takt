// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs API des charges et agrégations (L2-10)

import {
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type ChargeDimension = 'departement' | 'formation' | 'module' | 'groupe' | 'type';

export class ChargeQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Taille de page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filtrer par enseignant (UUID)' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par département (UUID)' })
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par formation (UUID)' })
  @IsOptional()
  @IsUUID()
  formationId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par module (UUID)' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par groupe (UUID)' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type d’enseignement (UUID)' })
  @IsOptional()
  @IsUUID()
  typeEnseignementId?: string;

  @ApiPropertyOptional({
    enum: ['departement', 'formation', 'module', 'groupe', 'type'],
    default: 'departement',
    description: 'Dimension d’agrégation',
  })
  @IsOptional()
  @IsEnum(['departement', 'formation', 'module', 'groupe', 'type'])
  dimension?: ChargeDimension = 'departement';
}

export interface ChargeAggregationItem {
  dimension: ChargeDimension;
  id: string;
  libelle: string;
  volumeBrut: number;
  chargePonderee: number;
  calculPartiel: boolean;
}

export class ChargeAggregationDto {
  @ApiProperty({ enum: ['departement', 'formation', 'module', 'groupe', 'type'], description: 'Dimension d’agrégation' })
  dimension: ChargeDimension;

  @ApiProperty({ description: 'ID de l’entité agrégée' })
  id: string;

  @ApiProperty({ description: 'Libellé de l’entité agrégée' })
  libelle: string;

  @ApiProperty({ description: 'Volume brut en heures' })
  volumeBrut: number;

  @ApiProperty({ description: 'Charge pondérée en heures' })
  chargePonderee: number;

  @ApiProperty({ description: 'Indique si le calcul est partiel (semestre sans répartition validée)' })
  calculPartiel: boolean;
}

export class ChargeEnseignantDetail {
  @ApiProperty({ description: 'Type d’enseignement' })
  type: string;

  @ApiProperty({ description: 'Volume en heures' })
  volume: number;

  @ApiProperty({ description: 'Coefficient appliqué' })
  coefficient: number;

  @ApiProperty({ description: 'Contribution (volume × coefficient)' })
  contribution: number;
}

export class ChargeEnseignantDto {
  @ApiProperty({ description: 'ID de l’enseignant' })
  enseignantId: string;

  @ApiProperty({ description: 'Matricule' })
  matricule: string;

  @ApiProperty({ description: 'Nom' })
  nom: string;

  @ApiProperty({ description: 'Prénom' })
  prenom: string;

  @ApiProperty({ description: 'Volume brut en heures' })
  volumeBrut: number;

  @ApiProperty({ description: 'Charge pondérée en heures' })
  chargePonderee: number;

  @ApiProperty({ description: 'Charge de référence du grade en heures' })
  chargeReference: number;

  @ApiProperty({ description: 'Décharges en heures' })
  decharges: number;

  @ApiProperty({ description: 'Service dû en heures' })
  serviceDu: number;

  @ApiProperty({ description: 'Écart = charge pondérée − service dû' })
  ecart: number;

  @ApiProperty({ description: 'Heures supplémentaires' })
  heuresSup: number;

  @ApiProperty({ description: 'Dépassement du plafond' })
  depassePlafond: boolean;

  @ApiProperty({ description: 'Calcul partiel (semestre sans répartition validée)' })
  calculPartiel: boolean;

  @ApiProperty({ type: [ChargeEnseignantDetail], description: 'Détail par activité' })
  detail: ChargeEnseignantDetail[];
}

export class PaginatedChargesDto {
  @ApiProperty({ type: [ChargeAggregationDto], description: 'Données paginées' })
  data: ChargeAggregationDto[];

  @ApiProperty({ description: 'Nombre total d’éléments' })
  total: number;

  @ApiProperty({ description: 'Numéro de page' })
  page: number;

  @ApiProperty({ description: 'Taille de page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}