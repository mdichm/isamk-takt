// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs d'import CSV/XLSX générique (L1-26)
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Types d'entités importables (L1-26)
// ============================================

export const ImportEntity = {
  ENSEIGNANTS: 'enseignants',
  SALLES: 'salles',
  GROUPES: 'groupes',
  MODULES: 'modules',
} as const;

export type ImportEntity = (typeof ImportEntity)[keyof typeof ImportEntity];

export const ALL_IMPORT_ENTITIES: ImportEntity[] = [
  ImportEntity.ENSEIGNANTS,
  ImportEntity.SALLES,
  ImportEntity.GROUPES,
  ImportEntity.MODULES,
];

// Taille maximale d'un fichier d'import : 10 Mo
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

// ============================================
// DTO d'entrée — POST /imports/:entite
// ============================================

export class ImportCsvDto {
  @ApiPropertyOptional({
    default: true,
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
}

// ============================================
// Aperçu (dryRun)
// ============================================

export type ImportAction = 'ajout' | 'modification' | 'doublon' | 'conflit' | 'erreur';

export class ImportPreviewItem {
  @ApiProperty({ description: 'Numéro de ligne dans le fichier (à partir de 2)' })
  ligne: number;

  @ApiProperty({ description: 'Nom de la colonne concernée' })
  colonne: string;

  @ApiProperty({ description: 'Valeur lue dans la cellule' })
  valeur: string;

  @ApiProperty({ description: 'Action prévue', enum: ['ajout', 'modification', 'doublon', 'conflit', 'erreur'] })
  action: ImportAction;

  @ApiProperty({ description: 'Message explicatif' })
  message: string;

  @ApiPropertyOptional({ description: 'Correction attendue en cas d\'erreur' })
  correctionAttendue?: string;

  @ApiPropertyOptional({ description: 'ID de l\'entité cible existante (doublon/conflit)' })
  targetId?: string;
}

export class ImportImpact {
  @ApiProperty({ description: 'Type d\'entité concernée', enum: ALL_IMPORT_ENTITIES })
  entite: ImportEntity;

  @ApiProperty({ description: 'Code de l\'entité en conflit' })
  code: string;

  @ApiProperty({ type: [String], description: 'Références impactées (répartitions, snapshots, versions)' })
  utiliseDans: string[];
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

  @ApiProperty({ description: 'Entité importée', enum: ALL_IMPORT_ENTITIES })
  entite: ImportEntity;

  @ApiProperty({ description: 'Nombre total de lignes de données' })
  totalLignes: number;

  @ApiProperty({ type: [ImportPreviewItem], description: 'Détail ligne par ligne' })
  items: ImportPreviewItem[];

  @ApiProperty({ type: [ImportImpact], description: 'Impacts détectés sur les données existantes' })
  impacts: ImportImpact[];

  @ApiProperty({ type: ImportResume, description: 'Résumé par type d\'action' })
  resume: ImportResume;
}

export class ImportConflict {
  @ApiProperty({ description: 'Type d\'entité', enum: ALL_IMPORT_ENTITIES })
  entite: ImportEntity;

  @ApiProperty({ description: 'Code en conflit' })
  code: string;

  @ApiProperty({ description: 'ID de l\'entité cible existante' })
  targetId: string;
}

// ============================================
// Résultat de confirmation (application)
// ============================================

export class ImportResultDto {
  @ApiProperty({ description: 'ID de l\'import' })
  importId: string;

  @ApiProperty({ type: [String], description: 'IDs des entités créées' })
  crees: string[];

  @ApiProperty({ type: [String], description: 'IDs des entités ignorées (déjà importées)' })
  ignores: string[];

  @ApiProperty({ type: [String], description: 'Avertissements métier (ex: effectifs réinitialisés)' })
  avertissements: string[];

  @ApiPropertyOptional({ type: [ImportConflict], description: 'Conflits détectés (transaction rollbackée)' })
  conflits?: ImportConflict[];
}

// ============================================
// Erreur de fichier (taille / type / parsing)
// ============================================

export class ImportFileError {
  @ApiProperty({ description: 'Code d\'erreur' })
  code: string;

  @ApiProperty({ description: 'Message explicatif' })
  message: string;
}
