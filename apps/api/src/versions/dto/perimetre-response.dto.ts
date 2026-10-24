// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse du périmètre de version (L4-13)
// GET /versions/{id}/perimetre : périmètre figé du semestre complet et empreinte.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDate,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Périmètre (L4-13)
// ============================================

export class PerimetreDepartementDto {
  @ApiProperty({ description: 'Identifiant du departement' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code du departement (ex: INFO, MATH)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Libelle du departement' })
  @IsString()
  libelle: string;
}

export class PerimetreActiviteDto {
  @ApiProperty({ description: 'Identifiant de l activite (affectation)' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code du module' })
  @IsString()
  moduleCode: string;

  @ApiProperty({ description: 'Type d enseignement' })
  @IsString()
  typeEnseignement: string;
}

export class PerimetreGroupeDto {
  @ApiProperty({ description: 'Identifiant du groupe' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code du groupe (ex: INFO-L3-S1)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Niveau du groupe' })
  @IsString()
  niveau: string;

  @ApiProperty({ description: 'Effectif du groupe' })
  @IsNumber()
  effectif: number;
}

export class PerimetreEnseignantDto {
  @ApiProperty({ description: 'Identifiant de l enseignant' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Nom de l enseignant' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prenom de l enseignant' })
  @IsString()
  prenom: string;
}

export class PerimetreSalleDto {
  @ApiProperty({ description: 'Identifiant de la salle' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code de la salle (ex: AMPHI-A)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Capacite maximale de la salle' })
  @IsNumber()
  capacite: number;
}

export class PerimetreContrainteDto {
  @ApiProperty({ description: 'Identifiant de la contrainte' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Code de la contrainte' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Libelle de la contrainte' })
  @IsString()
  libelle: string;

  @ApiProperty({ description: 'Nature de la contrainte' })
  @IsString()
  nature: string;

  @ApiProperty({ description: 'Portee de la contrainte' })
  @IsString()
  portee: string;

  @ApiProperty({ description: 'La contrainte est active' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class PerimetreVerrouDto {
  @ApiProperty({ description: 'Identifiant du verrou' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Type de verrou' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Identifiant de la seance verrouillee' })
  @IsUUID()
  seanceId: string;

  @ApiPropertyOptional({ description: 'Date de levee du verrou (null si actif)' })
  @IsOptional()
  @IsDate()
  leveLe?: Date | null;
}

export class PerimetreProfilDto {
  @ApiProperty({ description: 'Identifiant du profil de generation' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Nom du profil' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Numero de version du profil' })
  @IsNumber()
  numero: number;

  @ApiProperty({ description: 'Le profil est par defaut pour le semestre' })
  @IsBoolean()
  estParDefaut: boolean;

  @ApiPropertyOptional({ description: 'Version du moteur (ex: FET 7.12.0)' })
  @IsOptional()
  @IsString()
  engineVersion?: string | null;

  @ApiPropertyOptional({ description: 'Version de l adaptateur (constructeur)' })
  @IsOptional()
  @IsString()
  constructeurVersion?: string | null;
}

export class PerimetreResponseDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Identifiant du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'Numero de l annee universitaire' })
  @IsString()
  annee: string;

  @ApiProperty({ description: 'Numero du semestre (1 ou 2)' })
  @IsNumber()
  semestreNumero: number;

  @ApiProperty({ type: [PerimetreDepartementDto], description: 'Departements du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreDepartementDto)
  departements: PerimetreDepartementDto[];

  @ApiProperty({ type: [PerimetreActiviteDto], description: 'Activites du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreActiviteDto)
  activites: PerimetreActiviteDto[];

  @ApiProperty({ type: [PerimetreGroupeDto], description: 'Groupes du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreGroupeDto)
  groupes: PerimetreGroupeDto[];

  @ApiProperty({ type: [PerimetreEnseignantDto], description: 'Enseignants du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreEnseignantDto)
  enseignants: PerimetreEnseignantDto[];

  @ApiProperty({ type: [PerimetreSalleDto], description: 'Salles du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreSalleDto)
  salles: PerimetreSalleDto[];

  @ApiProperty({ type: [PerimetreContrainteDto], description: 'Contraintes actives du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreContrainteDto)
  contraintes: PerimetreContrainteDto[];

  @ApiProperty({ type: [PerimetreVerrouDto], description: 'Verrous du perimetre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimetreVerrouDto)
  verrous: PerimetreVerrouDto[];

  @ApiPropertyOptional({ type: PerimetreProfilDto, description: 'Profil de generation associe' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PerimetreProfilDto)
  profil?: PerimetreProfilDto | null;

  @ApiPropertyOptional({ description: 'Version du jeu de regles de charge' })
  @IsOptional()
  @IsString()
  versionDuJeuDeRegles?: string | null;

  @ApiPropertyOptional({ description: 'Version de l adaptateur (constructeur)' })
  @IsOptional()
  @IsString()
  versionAdaptateur?: string | null;

  @ApiProperty({ description: 'Empreinte SHA-256 du perimetre (snapshots, contraintes, exigences, verrous, grille)' })
  @IsString()
  perimetreHash: string;

  @ApiProperty({ description: 'Date et heure de generation de l empreinte' })
  @IsDate()
  genereLe: Date;
}
