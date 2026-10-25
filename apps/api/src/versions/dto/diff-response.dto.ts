// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse du diff entre deux versions (L5-11)
// GET /versions/{id}/diff?against=

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';

// ============================================
// Diff entre deux versions (L5-11)
// ============================================

export class SeanceValeurDto {
  @ApiPropertyOptional({ description: 'Jour de la semaine', example: 'LUNDI' })
  @IsOptional()
  @IsString()
  jour?: string;

  @ApiPropertyOptional({ description: 'Identifiant du créneau de début', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID()
  creneauDebutId?: string;

  @ApiPropertyOptional({ description: 'Identifiant de la salle', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ description: 'Identifiant de l enseignant', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'Statut de la séance', example: 'PLACEE' })
  @IsOptional()
  @IsString()
  statut?: string;
}

export class ChangementSeanceDto {
  @ApiProperty({
    description: 'Clé d appariement (affectationKey#rang)',
    example: 'INFO:M01:CM:ENS01#1',
  })
  @IsString()
  cle: string;

  @ApiProperty({
    enum: ['DEPLACE', 'SALLE_MODIFIEE', 'ENSEIGNANT_MODIFIE', 'STATUT_MODIFIE'],
    description: 'Type de différence détectée',
  })
  @IsEnum(['DEPLACE', 'SALLE_MODIFIEE', 'ENSEIGNANT_MODIFIE', 'STATUT_MODIFIE'])
  type: 'DEPLACE' | 'SALLE_MODIFIEE' | 'ENSEIGNANT_MODIFIE' | 'STATUT_MODIFIE';

  @ApiProperty({ description: 'Valeurs dans la version courante (gauche)', type: SeanceValeurDto })
  gauche: SeanceValeurDto;

  @ApiProperty({ description: 'Valeurs dans la version de référence (droite)', type: SeanceValeurDto })
  droite: SeanceValeurDto;
}

export class ConflitDiffDto {
  @ApiProperty({ description: 'Conflits apparus dans la version courante (non résolus)', example: 3 })
  @IsNumber()
  apparus: number;

  @ApiProperty({ description: 'Conflits disparus par rapport à la version de référence (non résolus)', example: 1 })
  @IsNumber()
  disparus: number;
}

export class VerrouDiffDto {
  @ApiProperty({ description: 'Verrous de séance actifs (non levés) dans la version courante', example: 2 })
  @IsNumber()
  respectesGauche: number;

  @ApiProperty({ description: 'Verrous de séance actifs (non levés) dans la version de référence', example: 2 })
  @IsNumber()
  respectesDroite: number;
}

export class VersionDiffResponseDto {
  @ApiProperty({ description: 'Identifiant de la version courante (gauche)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Numéro de la version courante', example: '1.1' })
  @IsString()
  versionNumero: string;

  @ApiProperty({ description: 'Identifiant de la version de référence (droite)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  againstId: string;

  @ApiProperty({ description: 'Numéro de la version de référence', example: '1.0' })
  @IsString()
  againstNumero: string;

  @ApiProperty({ description: 'Nombre de séances identiques (même clé, mêmes attributs)', example: 120 })
  @IsNumber()
  seancesIdentiques: number;

  @ApiProperty({ description: 'Nombre de séances différentes (même clé, au moins un attribut différent)', example: 5 })
  @IsNumber()
  seancesDifferentes: number;

  @ApiProperty({ description: 'Détail des séances modifiées', type: [ChangementSeanceDto] })
  @IsArray()
  changements: ChangementSeanceDto[];

  @ApiProperty({ description: 'Clés de séances présentes uniquement dans la version courante', type: [String] })
  @IsArray()
  @IsString({ each: true })
  seulesAGauche: string[];

  @ApiProperty({ description: 'Clés de séances présentes uniquement dans la version de référence', type: [String] })
  @IsArray()
  @IsString({ each: true })
  seulesADroite: string[];

  @ApiProperty({ type: ConflitDiffDto })
  conflits: ConflitDiffDto;

  @ApiProperty({ type: VerrouDiffDto })
  verrous: VerrouDiffDto;
}