// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de prévisualisation avant publication (L5-08)
// GET /versions/{id}/previsualisation-publication

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import type { VersionStatut, ConflitSeverite, VerrouType } from '@takt/db';

// ============================================
// Réponse : prévisualisation avant publication (L5-08)
// ============================================

export class DepartementValideDto {
  @ApiProperty({ description: 'Identifiant du département' })
  @IsUUID()
  departementId: string;

  @ApiProperty({ description: 'Code du département' })
  @IsString()
  departementCode: string;

  @ApiProperty({ description: 'Libellé du département' })
  @IsString()
  departementLibelle: string;

  @ApiProperty({ description: 'Décision de validation' })
  @IsString()
  decision: string;

  @ApiPropertyOptional({ description: 'Auteur de la décision' })
  @IsOptional()
  @IsString()
  userId?: string | null;

  @ApiPropertyOptional({ description: 'Date de la décision' })
  @IsOptional()
  @IsDateString()
  at?: string | null;
}

export class ConflitPrevisDto {
  @ApiProperty({ description: 'Identifiant du conflit' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Type de conflit' })
  @IsString()
  type: string;

  @ApiProperty({ enum: ['BLOQUANT', 'AVERTISSEMENT'], description: 'Sévérité du conflit' })
  @IsString()
  severite: ConflitSeverite;

  @ApiPropertyOptional({ description: 'Date de résolution (null si non résolu)' })
  @IsOptional()
  @IsDateString()
  resoluLe?: string | null;
}

export class AvertissementAccepteDto {
  @ApiProperty({ description: 'Code de la règle ou contrainte concernée' })
  @IsString()
  regleCode: string;

  @ApiProperty({ description: 'Identifiant de l auteur de l acceptation' })
  @IsUUID()
  auteurId: string;

  @ApiProperty({ description: 'Date d acceptation' })
  @IsDateString()
  accepteLe: string;
}

export class VerrouPrevisDto {
  @ApiProperty({ description: 'Identifiant du verrou' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: ['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'], description: 'Type de verrou' })
  @IsString()
  type: VerrouType;

  @ApiProperty({ description: 'Identifiant de la séance verrouillée' })
  @IsUUID()
  seanceId: string;

  @ApiProperty({ description: 'Identifiant de l auteur du verrou' })
  @IsUUID()
  auteurId: string;

  @ApiProperty({ description: 'Date de création du verrou' })
  @IsDateString()
  creeLe: string;
}

export class ProvenanceDto {
  @ApiPropertyOptional({ description: 'Identifiant de la génération source' })
  @IsOptional()
  @IsUUID()
  generationId?: string | null;

  @ApiPropertyOptional({ description: 'Numéro du profil de génération utilisé' })
  @IsOptional()
  @IsString()
  profilVersion?: string | null;

  @ApiPropertyOptional({ description: 'Nom du profil de génération' })
  @IsOptional()
  @IsString()
  profilNom?: string | null;

  @ApiPropertyOptional({ description: 'Empreinte du périmètre' })
  @IsOptional()
  @IsString()
  perimetreHash?: string | null;

  @ApiPropertyOptional({ description: 'Version du moteur d export' })
  @IsOptional()
  @IsString()
  engineVersion?: string | null;
}

export class ActivitePrevisDto {
  @ApiProperty({ description: 'Clé d affectation' })
  @IsString()
  affectationKey: string;

  @ApiPropertyOptional({ description: 'Identifiant de l enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string | null;

  @ApiProperty({ description: 'Nom de l enseignant' })
  @IsString()
  enseignantNom: string;

  @ApiProperty({ description: 'Identifiant de la salle (null si non planifiée)' })
  @IsOptional()
  @IsUUID()
  salleId?: string | null;

  @ApiProperty({ description: 'Code de la salle (null si non planifiée)' })
  @IsOptional()
  @IsString()
  salleCode?: string | null;

  @ApiProperty({ description: 'Planifiée (une salle est affectée)' })
  planifiee: boolean;
}

export class PrevisualisationPublicationDto {
  @ApiProperty({ description: 'Identifiant de la version candidate' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Numéro de la version candidate' })
  @IsString()
  versionNumero: string;

  @ApiProperty({ enum: ['BROUILLON', 'EDITION', 'PRET_POUR_VALIDATION', 'EN_VALIDATION', 'VALIDE', 'PUBLIE', 'ARCHIVE', 'CORRECTION'], description: 'Statut de la version candidate' })
  @IsString()
  statut: VersionStatut;

  @ApiProperty({ description: 'Révision de la version candidate' })
  revision: number;

  @ApiPropertyOptional({ description: 'Identifiant de la version précédente publiée' })
  @IsOptional()
  @IsUUID()
  versionPrecedenteId?: string | null;

  @ApiPropertyOptional({ description: 'Numéro de la version précédente publiée' })
  @IsOptional()
  @IsString()
  versionPrecedenteNumero?: string | null;

  @ApiProperty({ type: [DepartementValideDto], description: 'Départements ayant validé la version' })
  @IsArray()
  departementsValides: DepartementValideDto[];

  @ApiProperty({ description: 'Nombre d activités modifiées par rapport à la version précédente' })
  activitesModifiees: number;

  @ApiProperty({ type: [ConflitPrevisDto], description: 'Conflits de la version' })
  @IsArray()
  conflits: ConflitPrevisDto[];

  @ApiProperty({ type: [AvertissementAccepteDto], description: 'Avertissements acceptés' })
  @IsArray()
  avertissementsAcceptes: AvertissementAccepteDto[];

  @ApiProperty({ type: [VerrouPrevisDto], description: 'Verrous de séance actifs' })
  @IsArray()
  verrous: VerrouPrevisDto[];

  @ApiProperty({ type: ProvenanceDto, description: 'Provenance de la version' })
  provenance: ProvenanceDto;

  @ApiProperty({ type: [ActivitePrevisDto], description: 'Activités planifiées ou non' })
  @IsArray()
  activites: ActivitePrevisDto[];

  @ApiProperty({ description: 'Date et heure de la prévisualisation' })
  @IsDateString()
  at: string;
}
