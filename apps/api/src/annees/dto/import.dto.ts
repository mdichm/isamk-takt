// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs d'import depuis une année clôturée (L1-24)
import { IsArray, IsBoolean, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Types d'entités importables (L1-24)
// ============================================

export const ImportType = {
  DEPARTEMENTS: 'departements',
  FORMATIONS: 'formations',
  NIVEAUX: 'niveaux',
  GROUPES: 'groupes',
  MODULES: 'modules',
  SALLES: 'salles',
  ENSEIGNANTS: 'enseignants',
  CRENEAUX: 'creneaux',
  GRILLE_RAMADAN: 'grilleRamadan',
} as const;

export type ImportType = (typeof ImportType)[keyof typeof ImportType];

export const ALL_IMPORT_TYPES: ImportType[] = [
  ImportType.DEPARTEMENTS,
  ImportType.FORMATIONS,
  ImportType.NIVEAUX,
  ImportType.GROUPES,
  ImportType.MODULES,
  ImportType.SALLES,
  ImportType.ENSEIGNANTS,
  ImportType.CRENEAUX,
  ImportType.GRILLE_RAMADAN,
];

// Ordre d'import respectant les dépendances (parents d'abord)
export const IMPORT_ORDER: ImportType[] = [
  ImportType.DEPARTEMENTS,
  ImportType.FORMATIONS,
  ImportType.NIVEAUX,
  ImportType.GROUPES,
  ImportType.MODULES,
  ImportType.SALLES,
  ImportType.ENSEIGNANTS,
  ImportType.CRENEAUX,
  ImportType.GRILLE_RAMADAN,
];

// ============================================
// DTO d'entrée — POST /annees/:id/import
// ============================================

export class ImportAnneeDto {
  @ApiProperty({
    description: 'ID de l\'année cible (destinataire de l\'import)',
    example: 'uuid-cible-annee',
  })
  @IsUUID()
  cibleAnneeId: string;

  @ApiProperty({
    description: 'Types de données à importer',
    enum: ALL_IMPORT_TYPES,
    isArray: true,
    example: ['departements', 'formations', 'niveaux', 'groupes'],
  })
  @IsArray()
  @IsEnum(ImportType, { each: true })
  types: ImportType[];

  @ApiPropertyOptional({
    default: false,
    description: 'Si true, retourne uniquement l\'aperçu sans écrire en base',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Confirmer l\'application de l\'import (requis si dryRun=false)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  confirmation?: boolean;

  @ApiPropertyOptional({
    description: 'ID d\'import pour l\'idempotence (généré automatiquement si absent)',
    example: 'uuid-import-123',
  })
  @IsOptional()
  @IsUUID()
  importId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Réinitialiser les effectifs à 0 pour les groupes importés',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reinitialiserEffectifs?: boolean;
}

// ============================================
// Aperçu (dryRun)
// ============================================

export type ImportAction = 'ajout' | 'modification' | 'doublon' | 'conflit' | 'erreur';

export class ImportPreviewItem {
  @ApiProperty({ description: 'Type d\'entité', enum: ALL_IMPORT_TYPES })
  type: ImportType;

  @ApiProperty({ description: 'ID de l\'entité source (année source)' })
  sourceId: string;

  @ApiProperty({ description: 'Code / matricule de l\'entité source (affichage)' })
  sourceCode: string;

  @ApiProperty({ description: 'Action prévue', enum: ['ajout', 'modification', 'doublon', 'conflit', 'erreur'] })
  action: ImportAction;

  @ApiProperty({ description: 'Message explicatif' })
  message: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité cible existante (doublon/conflit)' })
  targetId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité source déjà importée (doublon)' })
  sourceOriginId?: string;
}

export class ImportConflict {
  @ApiProperty({ description: 'Type d\'entité', enum: ALL_IMPORT_TYPES })
  type: ImportType;

  @ApiProperty({ description: 'Code en conflit' })
  code: string;

  @ApiProperty({ description: 'ID de l\'entité source concernée' })
  sourceId: string;

  @ApiProperty({ description: 'ID de l\'entité cible déjà existante' })
  targetId: string;
}

export class ImportResume {
  @ApiProperty({ description: 'Nombre d\'ajouts prévus' })
  ajout: number;

  @ApiProperty({ description: 'Nombre de modifications prévues' })
  modification: number;

  @ApiProperty({ description: 'Nombre de doublons (déjà importés, ignorés)' })
  doublon: number;

  @ApiProperty({ description: 'Nombre de conflits (code utilisé par une autre entité)' })
  conflit: number;

  @ApiProperty({ description: 'Nombre d\'erreurs' })
  erreur: number;
}

export class ImportPreviewDto {
  @ApiProperty({ description: 'ID de l\'import (pour idempotence)' })
  importId: string;

  @ApiProperty({ description: 'Année source', example: '2026-2027' })
  sourceAnneeCode: string;

  @ApiProperty({ description: 'Année cible', example: '2027-2028' })
  cibleAnneeCode: string;

  @ApiProperty({ type: [ImportPreviewItem], description: 'Détail des entités à importer' })
  items: ImportPreviewItem[];

  @ApiProperty({ type: [ImportConflict], description: 'Conflits bloquants (aucun import si non vide)' })
  conflits: ImportConflict[];

  @ApiProperty({ type: [String], description: 'Avertissements métier' })
  avertissements: string[];

  @ApiProperty({ type: ImportResume, description: 'Résumé par type d\'action' })
  resume: ImportResume;
}

// ============================================
// Résultat de confirmation (application)
// ============================================

export class ImportResultDto {
  @ApiProperty({ description: 'ID de l\'import' })
  importId: string;

  @ApiProperty({ description: 'IDs des entités créées par type' })
  crees: Record<string, string[]>;

  @ApiProperty({ description: 'IDs des entités ignorées (déjà importées) par type' })
  ignores: Record<string, string[]>;

  @ApiProperty({ type: [String], description: 'Avertissements métier (ex: effectifs réinitialisés)' })
  avertissements: string[];

  @ApiPropertyOptional({ type: [ImportConflict], description: 'Conflits détectés (transaction rollbackée)' })
  conflits?: ImportConflict[];
}
