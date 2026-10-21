import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsIn, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type RepartitionStatut = 'BROUILLON' | 'VALIDEE' | 'ROUVERTE';

export const RepartitionStatut = {
  BROUILLON: 'BROUILLON' as const,
  VALIDEE: 'VALIDEE' as const,
  ROUVERTE: 'ROUVERTE' as const,
} as const;

export class CreateRepartitionDto {
  @ApiProperty({ description: 'ID du semestre (UUID)' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'ID du département (UUID)' })
  @IsUUID()
  departementId: string;

  @ApiPropertyOptional({ default: 'BROUILLON', enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: RepartitionStatut;

  @ApiPropertyOptional({ description: 'Libellé optionnel de la répartition' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  libelle?: string;
}

export class UpdateRepartitionDto {
  @ApiPropertyOptional({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: RepartitionStatut;

  @ApiPropertyOptional({ description: 'Libellé optionnel de la répartition' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  libelle?: string;
}

export class RepartitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  departementId: string;

  @ApiProperty({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  statut: RepartitionStatut;

  @ApiPropertyOptional()
  libelle?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedRepartitionsDto {
  @ApiProperty({ type: [RepartitionResponseDto] })
  data: RepartitionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class RepartitionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departementId?: string;
}

// ============================================
// Contrôles de cohérence des volumes (L2-09)
// ============================================

export type ControleStatut = 'COUVERT' | 'NON_COUVERT' | 'EXCEDENT';

export const ControleStatut = {
  COUVERT: 'COUVERT' as const,
  NON_COUVERT: 'NON_COUVERT' as const,
  EXCEDENT: 'EXCEDENT' as const,
} as const;

export class ControleVolumeDto {
  @ApiPropertyOptional({ description: 'ID du groupe (null si affecté sans groupe)' })
  @IsOptional()
  @IsUUID()
  groupeId?: string | null;

  @ApiPropertyOptional({ description: 'Libellé du groupe' })
  @IsOptional()
  @IsString()
  groupeLibelle?: string | null;

  @ApiProperty({ description: 'ID du module' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'Libellé du module' })
  @IsString()
  moduleLibelle: string;

  @ApiProperty({ description: "ID du type d'enseignement" })
  @IsUUID()
  typeEnseignementId: string;

  @ApiProperty({ description: "Code du type d'enseignement (CM, TD, TP, CI, AUTRE)", enum: ['CM', 'TD', 'TP', 'CI', 'AUTRE'] })
  @IsString()
  typeCode: string;

  @ApiProperty({ description: 'Volume attendu en minutes (multiple de 30)' })
  @IsInt()
  @Min(0)
  volumeAttendu: number;

  @ApiProperty({ description: 'Volume affecté en minutes (somme des affectations)' })
  @IsInt()
  @Min(0)
  volumeAffecte: number;

  @ApiProperty({ description: 'Écart = volume attendu − volume affecté (en minutes)' })
  @IsInt()
  ecart: number;

  @ApiProperty({ enum: ['COUVERT', 'NON_COUVERT', 'EXCEDENT'] })
  @IsIn(['COUVERT', 'NON_COUVERT', 'EXCEDENT'])
  statut: ControleStatut;
}

export class ControlesResponseDto {
  @ApiProperty({ description: 'ID de la répartition' })
  @IsUUID()
  repartitionId: string;

  @ApiProperty({ type: [ControleVolumeDto] })
  controles: ControleVolumeDto[];
}

// ============================================
// Validation de la répartition (L2-12)
// ============================================

export class SnapshotAffectationDto {
  @ApiProperty({ description: 'ID de l\'enseignant' })
  @IsUUID()
  enseignantId: string;

  @ApiPropertyOptional({ description: 'ID du groupe' })
  @IsOptional()
  @IsUUID()
  groupeId?: string | null;

  @ApiProperty({ description: 'ID du module' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: "ID du type d'enseignement" })
  @IsUUID()
  typeEnseignementId: string;

  @ApiPropertyOptional({ description: 'ID du tag d\'activité' })
  @IsOptional()
  @IsUUID()
  activityTagId?: string | null;

  @ApiProperty({ description: 'Volume hebdomadaire en minutes' })
  @IsInt()
  @Min(0)
  volumeHebdoMinutes: number;

  @ApiProperty({ description: 'Séances par semaine' })
  @IsInt()
  @Min(1)
  seancesParSemaine: number;

  @ApiProperty({ description: 'Durée en minutes (multiple de 30)' })
  @IsInt()
  @Min(0)
  dureeMinutes: number;

  @ApiProperty({ description: 'Cours commun CM' })
  estCmCommun: boolean;

  @ApiProperty({ description: 'Révision de travail' })
  @IsInt()
  workingRevision: number;
}

export class SnapshotChargeDto {
  @ApiProperty({ description: 'ID de l\'enseignant' })
  @IsUUID()
  enseignantId: string;

  @ApiProperty({ description: 'Volume brut en minutes' })
  @IsInt()
  @Min(0)
  volumeBrut: number;

  @ApiProperty({ description: 'Charge calculée en minutes' })
  @IsInt()
  @Min(0)
  chargeCalculee: number;

  @ApiProperty({ description: 'Charge de référence en minutes' })
  @IsInt()
  @Min(0)
  chargeReference: number;

  @ApiProperty({ description: 'Décharges en minutes' })
  @IsInt()
  @Min(0)
  decharges: number;

  @ApiProperty({ description: 'Service dû en minutes' })
  @IsInt()
  @Min(0)
  serviceDu: number;

  @ApiProperty({ description: 'Écart en minutes (charge calculée − service dû)' })
  @IsInt()
  ecart: number;

  @ApiProperty({ description: 'Heures supplémentaires en minutes' })
  @IsInt()
  @Min(0)
  heuresSup: number;
}

export class ValidateRepartitionDto {
  @ApiProperty({ description: 'ID du snapshot créé' })
  @IsUUID()
  snapshotId: string;

  @ApiProperty({ description: 'ID de la répartition validée' })
  @IsUUID()
  repartitionId: string;

  @ApiProperty({ description: 'Tag résolu du snapshot' })
  @IsString()
  tag: string;

  @ApiProperty({ description: 'Hash de l\'état figé' })
  @IsString()
  hash: string;

  @ApiProperty({ description: 'Statut de la répartition après validation' })
  statut: RepartitionStatut;

  @ApiProperty({ description: 'Validé par (userId)' })
  @IsUUID()
  valideParId: string;

  @ApiProperty({ description: 'Date de validation' })
  valideLe: Date;

  @ApiProperty({ description: 'Validation par un Administrateur' })
  parAdministrateur: boolean;

  @ApiProperty({ type: [SnapshotAffectationDto], description: 'Affectations figées dans le snapshot' })
  affectations: SnapshotAffectationDto[];

  @ApiProperty({ type: [SnapshotChargeDto], description: 'Charges figées dans le snapshot' })
  charges: SnapshotChargeDto[];
}
