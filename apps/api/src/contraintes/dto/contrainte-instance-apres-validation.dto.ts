// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO pour modification de contrainte après validation (L5-14)
// PATCH /contraintes/instances/{id}/appliquer-apres-validation

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsIn, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import type { VersionStatut } from '@takt/db';
import { ConflitResponseDto } from '../../conflit/dto/conflit-response.dto.js';

// ============================================
// Modification de contrainte après validation (L5-14)
// ============================================

export type ApplicationMode = 'immediate' | 'next_generation';

export class ContrainteInstanceApresValidationDto {
  @ApiProperty({
    enum: ['immediate', 'next_generation'],
    description:
      'Mode d application : immediate = recalcul immédiat de la version de travail, ' +
      'next_generation = application reportée à la prochaine génération',
  })
  @IsIn(['immediate', 'next_generation'])
  application: ApplicationMode;

  @ApiPropertyOptional({
    description: 'ID du profil de génération (requis si application = next_generation)',
  })
  @IsOptional()
  @IsUUID()
  profilId?: string;

  @ApiPropertyOptional({ description: 'Nouvel identifiant de définition de contrainte' })
  @IsOptional()
  @IsUUID()
  definitionId?: string;

  @ApiPropertyOptional({ description: 'Nouvel enseignant cible' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'Nouveau groupe cible' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ description: 'Nouvelle salle cible' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ description: 'Nouveau module cible' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ description: 'Nouveau poids (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  poids?: number;

  @ApiPropertyOptional({ description: 'Nouvelle nature (REGLE ou VOEU)' })
  @IsOptional()
  @IsString()
  nature?: 'REGLE' | 'VOEU';

  @ApiPropertyOptional({ description: 'Nouveau commentaire' })
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ description: 'Instance active ou non' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ContrainteInstanceApresValidationResponseDto {
  @ApiProperty({ description: 'Identifiant de la version de travail créée (EDITION)' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ enum: ['EDITION'], description: 'Statut de la version de travail' })
  @IsString()
  statut: VersionStatut;

  @ApiProperty({
    enum: ['aucun', 'regenerer', 'annuler'],
    description:
      "Action requise pour l utilisateur : aucun = tout est OK, " +
      "regenerer = lancer une generation, annuler = revenir a la version publiee",
  })
  @IsString()
  actionRequiree: 'aucun' | 'regenerer' | 'annuler';

  @ApiProperty({
    type: [ConflitResponseDto],
    description: 'Conflits identifies (uniquement en application immediate)',
  })
  conflits: ConflitResponseDto[];

  @ApiPropertyOptional({
    description: "Identifiant de la version publiee de reference (null si aucune)",
  })
  @IsOptional()
  @IsUUID()
  versionPublieeId: string | null;
}