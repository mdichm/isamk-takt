// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de la chaîne de provenance d'une version (L5-12)
// GET /versions/{id}/provenance

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsArray, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Chaîne de provenance d'une version (L5-12)
// ============================================

export class ProfilProvenanceDto {
  @ApiPropertyOptional({ description: 'Identifiant du profil de génération' })
  @IsOptional()
  @IsUUID()
  id?: string | null;

  @ApiPropertyOptional({ description: 'Code du profil de génération' })
  @IsOptional()
  @IsString()
  code?: string | null;

  @ApiPropertyOptional({ description: 'Numéro de version du profil' })
  @IsOptional()
  @IsNumber()
  numero?: number | null;

  @ApiPropertyOptional({ description: 'Libellé du profil' })
  @IsOptional()
  @IsString()
  libelle?: string | null;

  @ApiPropertyOptional({ description: 'Version du moteur (FET)' })
  @IsOptional()
  @IsString()
  engineVersion?: string | null;

  @ApiPropertyOptional({ description: 'Version du builder' })
  @IsOptional()
  @IsString()
  builderVersion?: string | null;
}

export class GenerationProvenanceDto {
  @ApiPropertyOptional({ description: 'Identifiant de la génération source' })
  @IsOptional()
  @IsUUID()
  id?: string | null;

  @ApiPropertyOptional({ description: 'Statut de la génération' })
  @IsOptional()
  @IsString()
  statut?: string | null;

  @ApiPropertyOptional({ description: 'Mode de génération (AUTOMATIQUE / MANUELLE)' })
  @IsOptional()
  @IsString()
  mode?: string | null;

  @ApiPropertyOptional({ description: 'Moteur utilisé (ex: fet)' })
  @IsOptional()
  @IsString()
  engine?: string | null;

  @ApiPropertyOptional({ description: 'Version du moteur' })
  @IsOptional()
  @IsString()
  engineVersion?: string | null;

  @ApiPropertyOptional({ description: 'Empreinte du périmètre figé' })
  @IsOptional()
  @IsString()
  perimetreHash?: string | null;

  @ApiPropertyOptional({ description: 'Date de création de la génération' })
  @IsOptional()
  @IsDateString()
  creeLe?: string | null;

  @ApiProperty({ type: ProfilProvenanceDto, description: 'Profil de génération utilisé' })
  @IsOptional()
  profil?: ProfilProvenanceDto | null;
}

export class ChargeRuleSetProvenanceDto {
  @ApiProperty({ description: 'Identifiant du jeu de règles de charge' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code du jeu de règles' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Libellé du jeu de règles' })
  @IsString()
  libelle: string;

  @ApiPropertyOptional({ description: 'Version du jeu de règles' })
  @IsOptional()
  @IsString()
  version?: string | null;
}

export class SnapshotProvenanceDto {
  @ApiProperty({ description: 'Identifiant du snapshot de répartition' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Identifiant de la répartition source' })
  @IsUUID()
  repartitionId: string;

  @ApiProperty({ description: "Révision du snapshot" })
  @IsNumber()
  revision: number;

  @ApiProperty({ description: 'Empreinte du contenu du snapshot' })
  @IsString()
  contentHash: string;

  @ApiPropertyOptional({ description: 'Validé par un administrateur' })
  @IsOptional()
  @IsBoolean()
  parAdministrateur?: boolean | null;

  @ApiProperty({ description: 'Date de validation du snapshot' })
  @IsDateString()
  validatedAt: string;

  @ApiProperty({ type: ChargeRuleSetProvenanceDto, description: 'Jeu de règles de charge associé' })
  chargeRuleSet: ChargeRuleSetProvenanceDto;
}

export class SeanceOrigineDto {
  @ApiProperty({ description: 'Identifiant de la séance d origine' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Clé d affectation de la séance' })
  @IsString()
  affectationKey: string;

  @ApiPropertyOptional({ description: 'Jour de la semaine' })
  @IsOptional()
  @IsString()
  jour?: string | null;

  @ApiPropertyOptional({ description: 'Identifiant du créneau de début' })
  @IsOptional()
  @IsUUID()
  creneauDebutId?: string | null;

  @ApiPropertyOptional({ description: 'Identifiant de la salle' })
  @IsOptional()
  @IsUUID()
  salleId?: string | null;

  @ApiPropertyOptional({ description: 'Identifiant de l enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string | null;

  @ApiProperty({ description: 'Statut de la séance' })
  @IsString()
  statut: string;
}

export class AdaptateurProvenanceDto {
  @ApiProperty({ description: 'Nom de l adaptateur utilisé' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ description: 'Version de l adaptateur' })
  @IsOptional()
  @IsString()
  version?: string | null;

  @ApiPropertyOptional({ description: 'Paramètres de configuration de l adaptateur' })
  @IsOptional()
  @IsString()
  params?: string | null;
}

export class VersionProvenanceResponseDto {
  @ApiProperty({ description: 'Identifiant de la version', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Numéro de la version', example: '1.1' })
  @IsString()
  versionNumero: string;

  @ApiProperty({ enum: ['BROUILLON', 'EDITION', 'PRET_POUR_VALIDATION', 'EN_VALIDATION', 'VALIDE', 'PUBLIE', 'ARCHIVE', 'CORRECTION'], description: 'Statut de la version' })
  @IsString()
  statut: VersionStatut;

  @ApiProperty({ enum: ['GENERATION', 'MANUELLE'], description: "Origine de la version (génération automatique ou saisie manuelle)" })
  @IsEnum(['GENERATION', 'MANUELLE'])
  origine: 'GENERATION' | 'MANUELLE';

  @ApiPropertyOptional({ type: GenerationProvenanceDto, description: 'Génération source si origine GENERATION' })
  @IsOptional()
  generation?: GenerationProvenanceDto | null;

  @ApiPropertyOptional({ type: [SnapshotProvenanceDto], description: 'Snapshots de répartition référencés par la version' })
  @IsOptional()
  @IsArray()
  snapshots?: SnapshotProvenanceDto[];

  @ApiPropertyOptional({ type: ChargeRuleSetProvenanceDto, description: 'Jeu de règles de charge principal (si origine MANUELLE)' })
  @IsOptional()
  chargeRuleSet?: ChargeRuleSetProvenanceDto | null;

  @ApiPropertyOptional({ type: [ChargeRuleSetProvenanceDto], description: 'Tous les jeux de règles de charge des snapshots référencés' })
  @IsOptional()
  @IsArray()
  chargeRuleSets?: ChargeRuleSetProvenanceDto[];

  @ApiPropertyOptional({ type: AdaptateurProvenanceDto, description: 'Adaptateur utilisé pour l import / la génération' })
  @IsOptional()
  adaptateur?: AdaptateurProvenanceDto | null;

  @ApiPropertyOptional({ type: [SeanceOrigineDto], description: 'Séances d origine si origine MANUELLE' })
  @IsOptional()
  @IsArray()
  seancesOrigine?: SeanceOrigineDto[];

  @ApiProperty({ description: 'Date et heure de la génération de la provenance' })
  @IsDateString()
  at: string;
}
