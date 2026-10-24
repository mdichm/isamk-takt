// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs pour le tableau de préparation du semestre (L4-12)
// GET /semestres/{id}/preparation

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum NiveauAnomalie {
  BLOQUANT = 'BLOQUANT',
  AVERTISSEMENT = 'AVERTISSEMENT',
  INFORMATIF = 'INFORMATIF',
}

export class AnomaliePreparationDto {
  @ApiProperty({ enum: NiveauAnomalie, description: 'Niveau de gravité de l anomalie' })
  @IsEnum(NiveauAnomalie)
  niveau: NiveauAnomalie;

  @ApiProperty({ description: 'Type d objet concerné (ex: Grille, Groupe, Enseignant, Salle, Module, Répartition, Verrou, ExigenceSalle, Règle, Indisponibilité, Vœu, Profil)' })
  @IsString()
  objet: string;

  @ApiPropertyOptional({ description: 'Département concerné (si applicable)' })
  @IsOptional()
  @IsString()
  departement?: string | null;

  @ApiPropertyOptional({ description: 'Activité ou affectation concernée (si applicable)' })
  @IsOptional()
  @IsString()
  activite?: string | null;

  @ApiPropertyOptional({ description: 'Règle ou code de contrainte concerné (si applicable)' })
  @IsOptional()
  @IsString()
  regle?: string | null;

  @ApiProperty({ description: 'Explication de l anomalie' })
  @IsString()
  explication: string;

  @ApiProperty({ description: 'Action corrective suggérée' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Lien direct vers l écran de correction (si applicable)' })
  @IsOptional()
  @IsString()
  lien?: string | null;
}

export class ControlePreparationDto {
  @ApiProperty({ description: 'Numéro du contrôle (1 à 10)' })
  numero: number;

  @ApiProperty({ description: 'Libellé du contrôle' })
  libelle: string;

  @ApiProperty({ enum: NiveauAnomalie, description: 'Niveau de sévérité du contrôle' })
  @IsEnum(NiveauAnomalie)
  niveau: NiveauAnomalie;

  @ApiProperty({ description: 'Statut du contrôle' })
  statut: 'CONFORME' | 'NON_CONFORME';

  @ApiProperty({ type: [AnomaliePreparationDto], description: 'Anomalies détectées pour ce contrôle' })
  anomalies: AnomaliePreparationDto[];
}

export class PreparationResponseDto {
  @ApiProperty()
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'Indique si la génération peut être lancée (aucune anomalie bloquante)' })
  peutGenerer: boolean;

  @ApiProperty({ type: [ControlePreparationDto], description: 'Détail de chaque contrôle de préparation' })
  controles: ControlePreparationDto[];

  @ApiPropertyOptional({ description: 'Nombre total d anomalies bloquantes' })
  @IsOptional()
  nbBloquants?: number;

  @ApiPropertyOptional({ description: 'Nombre total d avertissements' })
  @IsOptional()
  nbAvertissements?: number;

  @ApiPropertyOptional({ description: 'Nombre total d informations' })
  @IsOptional()
  nbInfos?: number;
}

// ============================================
// Query DTO pour les filtres
// ============================================

export class PreparationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par département' })
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par groupe' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par salle' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par activité / affectation' })
  @IsOptional()
  @IsString()
  activite?: string;

  @ApiPropertyOptional({ description: 'Filtrer par règle / code de contrainte' })
  @IsOptional()
  @IsString()
  regle?: string;

  @ApiPropertyOptional({ enum: NiveauAnomalie, description: 'Filtrer par niveau' })
  @IsOptional()
  @IsEnum(NiveauAnomalie)
  niveau?: NiveauAnomalie;
}