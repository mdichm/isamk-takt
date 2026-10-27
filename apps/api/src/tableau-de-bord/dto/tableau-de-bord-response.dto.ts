// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse du tableau de bord (L5-26)
// GET /tableau-de-bord

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ActionPrioritaireDto } from './action-prioritaire.dto.js';
import { ChangementsDto } from './changements-dto.js';
import { ContexteDto } from './contexte-dto.js';
import { DirectionViewDto } from './direction-view-dto.js';
import { GenerationsResumeDto } from './generations-resume.dto.js';
import { PreparationResumeDto } from './preparation-resume.dto.js';
import { RepartitionDto } from './repartition-dto.js';
import { ResponsableViewDto } from './responsable-view-dto.js';
import { VersionEnPreparationDto } from './version-en-preparation.dto.js';
import { VersionPublieeDto } from './version-publiee-dto.js';

// ============================================
// Réponse du tableau de bord (L5-26)
// ============================================

export class TableauDeBordResponseDto {
  @ApiProperty({ description: 'Rôle de l utilisateur connecté', example: 'GESTIONNAIRE' })
  @IsString()
  role: string;

  @ApiProperty({ type: ContexteDto, description: 'Contexte : année et semestre actifs' })
  @ValidateNested()
  @Type(() => ContexteDto)
  contexte: ContexteDto;

  // --- GESTIONNAIRE / ADMINISTRATEUR ---
  @ApiPropertyOptional({
    type: [RepartitionDto],
    description: 'État des répartitions par département',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepartitionDto)
  repartitions?: RepartitionDto[];

  @ApiPropertyOptional({ description: 'Validations en attente' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  validationsEnAttente?: string[];

  @ApiPropertyOptional({ type: PreparationResumeDto, description: 'Résultat de la préparation' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreparationResumeDto)
  preparation?: PreparationResumeDto;

  @ApiPropertyOptional({ type: VersionEnPreparationDto, description: 'Version en préparation' })
  @IsOptional()
  @ValidateNested()
  @Type(() => VersionEnPreparationDto)
  versionEnPreparation?: VersionEnPreparationDto;

  @ApiPropertyOptional({ type: GenerationsResumeDto, description: 'Générations en cours et récentes' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenerationsResumeDto)
  generations?: GenerationsResumeDto;

  @ApiPropertyOptional({ type: VersionPublieeDto, description: 'Version publiée avec provenance' })
  @IsOptional()
  @ValidateNested()
  @Type(() => VersionPublieeDto)
  versionPubliee?: VersionPublieeDto;

  @ApiPropertyOptional({ type: ChangementsDto, description: 'Changements et départements impactés' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChangementsDto)
  changements?: ChangementsDto;

  @ApiPropertyOptional({
    type: [ActionPrioritaireDto],
    description: 'Actions prioritaires (au plus 5 par défaut, toutes avec ?actions=all)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionPrioritaireDto)
  actionsPrioritaires?: ActionPrioritaireDto[];

  // --- RESPONSABLE_DEPARTEMENT ---
  @ApiPropertyOptional({ type: ResponsableViewDto, description: 'Vue Responsable (répartitions, charges, validations, demandes)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsableViewDto)
  responsable?: ResponsableViewDto;

  // --- DIRECTION ---
  @ApiPropertyOptional({ type: DirectionViewDto, description: 'Vue Direction (version publiée, exports)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DirectionViewDto)
  direction?: DirectionViewDto;
}
