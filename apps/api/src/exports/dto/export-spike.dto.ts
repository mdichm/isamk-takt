// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du spike d'export PDF/Excel (L6-01, S2)
import { IsEnum, IsOptional, IsString, IsPositive, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const ExportFormat = {
  PDF: 'pdf',
  XLSX: 'xlsx',
} as const;

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ExportMode = {
  BROUILLON: 'brouillon',
  OFFICIEL: 'officiel',
} as const;

export type ExportMode = (typeof ExportMode)[keyof typeof ExportMode];

// ============================================
// DTO d'entrée — POST /exports/spike
// ============================================

export class ExportSpikeDto {
  @ApiProperty({
    description: 'Format d’export à tester',
    enum: ['pdf', 'xlsx'],
    example: 'pdf',
  })
  @IsEnum(['pdf', 'xlsx'])
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Nombre de pages à renderer (PDF uniquement)',
    default: 100,
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pages?: number;

  @ApiPropertyOptional({
    description: 'Mode d’export (brouillon ou officiel)',
    default: 'brouillon',
    enum: ['brouillon', 'officiel'],
    example: 'brouillon',
  })
  @IsOptional()
  @IsEnum(['brouillon', 'officiel'])
  mode?: ExportMode;

  @ApiPropertyOptional({
    description: 'Activer le rendu noir et blanc',
    default: true,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsString()
  monochrome?: boolean;
}

// ============================================
// Résultat du spike
// ============================================

export class RenderResultDto {
  @ApiProperty({ description: 'Format utilisé', enum: ['pdf', 'xlsx'] })
  format: ExportFormat;

  @ApiProperty({ description: 'Temps de rendu en millisecondes', example: 1250 })
  renderMs: number;

  @ApiProperty({ description: 'Taille du fichier en octets', example: 245760 })
  sizeBytes: number;

  @ApiProperty({ description: 'Nombre de pages rendues', example: 100 })
  pages: number;

  @ApiProperty({ description: 'Chemin du fichier généré' })
  filePath: string;

  @ApiProperty({ description: 'Rendu noir et blanc vérifié' })
  monochromeVerified: boolean;

  @ApiPropertyOptional({ description: 'Bibliothèque utilisée pour le rendu' })
  library?: string;

  @ApiPropertyOptional({ description: 'Notes du comparatif' })
  notes?: string;
}

// ============================================
// Réponse du spike (comparatif)
// ============================================

export class ExportSpikeResponseDto {
  @ApiProperty({ description: 'Résultat du rendu demandé' })
  result: RenderResultDto;

  @ApiProperty({ description: 'Recommandation de bibliothèque' })
  recommendedLibrary: string;

  @ApiProperty({ description: 'Justification du choix' })
  justification: string;
}
