// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs des instances de contraintes (L3-03)
import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { ContrainteNature } from '@takt/db';

// ============================================
// Instances de contraintes (L3-03)
// ============================================

export const ContrainteNatureValues = {
  REGLE: 'REGLE' as const,
  VOEU: 'VOEU' as const,
} as const;

export class ContrainteInstanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  definitionId: string;

  @ApiPropertyOptional({ example: 'uuid-enseignant', description: 'ID de l\'enseignant cible' })
  enseignantId?: string;

  @ApiPropertyOptional({ example: 'uuid-groupe', description: 'ID du groupe cible' })
  groupeId?: string;

  @ApiPropertyOptional({ example: 'uuid-salle', description: 'ID de la salle cible' })
  salleId?: string;

  @ApiPropertyOptional({ example: 'uuid-module', description: 'ID du module cible' })
  moduleId?: string;

  @ApiProperty()
  params: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, description: 'Poids 0-100 (null pour contraintes dures)' })
  poids?: number;

  @ApiProperty({ enum: ['REGLE', 'VOEU'] })
  nature: ContrainteNature;

  @ApiPropertyOptional()
  commentaire?: string;

  @ApiProperty()
  actif: boolean;

  @ApiProperty()
  creePar: string;

  @ApiProperty()
  creeLe: Date;
}

export class ContrainteInstanceCreateDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'uuid-definition', description: 'ID de la définition de contrainte' })
  @IsUUID()
  definitionId: string;

  @ApiPropertyOptional({ example: 'uuid-enseignant', description: 'ID de l\'enseignant cible (portee ENSEIGNANT)' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ example: 'uuid-groupe', description: 'ID du groupe cible (portee GROUPE)' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ example: 'uuid-salle', description: 'ID de la salle cible (portee SALLE)' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ example: 'uuid-module', description: 'ID du module cible (portee MODULE)' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({ description: 'Paramètres de la contrainte (JSON)' })
  params: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, description: 'Poids 0-100 (obligatoire pour souples, null pour dures)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  poids?: number;

  @ApiProperty({ enum: ['REGLE', 'VOEU'], default: 'REGLE', description: 'Nature de la contrainte' })
  @IsIn(['REGLE', 'VOEU'])
  nature: ContrainteNature;

  @ApiPropertyOptional({ description: 'Commentaire libre' })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ContrainteInstanceUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  definitionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  params?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  poids?: number;

  @ApiPropertyOptional({ enum: ['REGLE', 'VOEU'] })
  @IsOptional()
  @IsIn(['REGLE', 'VOEU'])
  nature?: ContrainteNature;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ContrainteInstanceListQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par semestre' })
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par définition de contrainte' })
  @IsOptional()
  @IsUUID()
  definitionId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par enseignant cible' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par groupe cible' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par salle cible' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par module cible' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ enum: ['REGLE', 'VOEU'] })
  @IsOptional()
  @IsIn(['REGLE', 'VOEU'])
  nature?: ContrainteNature;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class PaginatedContrainteInstancesDto {
  @ApiProperty({ type: [ContrainteInstanceResponseDto] })
  data: ContrainteInstanceResponseDto[];

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
// Duplication de contraintes (L3-07)
// ============================================

export class ContrainteDuplicateDto {
  @ApiProperty({ example: 'uuid-semestre-source', description: 'ID du semestre source' })
  @IsUUID()
  sourceSemestreId: string;

  @ApiProperty({ example: 'uuid-semestre-cible', description: 'ID du semestre cible' })
  @IsUUID()
  cibleSemestreId: string;

  @ApiPropertyOptional({
    enum: ['REGLE', 'VOEU'],
    example: ['REGLE', 'VOEU'],
    description: 'Filtrer par nature (règle ou vœu). Toutes les natures par défaut.',
  })
  @IsOptional()
  @IsIn(['REGLE', 'VOEU'], { each: true })
  natures?: ContrainteNature[];
}

export class ContrainteNonCopieeDto {
  @ApiProperty({ description: 'ID de la définition de contrainte' })
  definitionId: string;

  @ApiProperty({ description: 'Type de sujet (enseignant, groupe, salle, module)' })
  sujetType: string;

  @ApiProperty({ description: 'ID du sujet cible' })
  sujetId: string;

  @ApiProperty({ description: 'Raison du non-copiage' })
  raison: string;
}

export class IndisponibiliteNonCopieeDto {
  @ApiProperty({ example: 'LUNDI', description: 'Jour de la semaine' })
  jour: string;

  @ApiProperty({ example: 3, description: 'Ordre du créneau dans la journée' })
  ordre: number;

  @ApiProperty({ description: 'Raison du non-copiage' })
  raison: string;
}

export class ContrainteDuplicateResponseDto {
  @ApiProperty({ example: 5, description: 'Nombre de contraintes créées' })
  contraintesCrees: number;

  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'], description: 'IDs des contraintes créées' })
  contraintesIds: string[];

  @ApiProperty({ type: [ContrainteNonCopieeDto], description: 'Contraintes non copiées avec raison' })
  contraintesNonCopiees: ContrainteNonCopieeDto[];

  @ApiProperty({ example: 3, description: 'Nombre d\'indisponibilités créées' })
  indisponibilitesCrees: number;

  @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'], description: 'IDs des indisponibilités créées' })
  indisponibilitesIds: string[];

  @ApiProperty({ type: [IndisponibiliteNonCopieeDto], description: 'Indisponibilités non copiées avec raison' })
  indisponibilitesNonCopiees: IndisponibiliteNonCopieeDto[];
}