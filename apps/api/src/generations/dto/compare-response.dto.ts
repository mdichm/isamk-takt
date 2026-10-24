// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de comparaison de générations (L4-18)
// GET /generations/compare

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Comparaison de générations (L4-18)
// ============================================

export class GenerationSummaryDto {
  @ApiProperty({
    description: 'Identifiant de la génération',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Score global de la génération (0-100)',
    example: 87.5,
    type: Number,
  })
  score?: number;

  @ApiProperty({
    description: 'La génération est classée (état SUCCEEDED avec score)',
    example: true,
  })
  classee: boolean;

  @ApiPropertyOptional({
    description: 'Métriques calculées par GenerationMetricsService (L4-17)',
    type: 'object',
    additionalProperties: true,
    example: { dureeTotale: 1200, nbConflits: 3, nbNonPlacees: 0 },
  })
  metrics?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Motif si la génération n est pas classée',
    example: 'Génération échouée (statut FAILED)',
  })
  motifNonClassee?: string;
}

export class SeanceValeurDto {
  @ApiProperty({
    description: 'Identifiant de la génération',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  generationId: string;

  @ApiPropertyOptional({
    description: 'Jour de la semaine',
    example: 'LUNDI',
  })
  jour?: string;

  @ApiPropertyOptional({
    description: 'Identifiant du créneau de début',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  creneauDebutId?: string;

  @ApiPropertyOptional({
    description: 'Identifiant de la salle',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  salleId?: string;

  @ApiPropertyOptional({
    description: 'Identifiant de l enseignant',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  enseignantId?: string;
}

export class ChangementSeanceDto {
  @ApiProperty({
    description: 'Clé d appariement (affectationKey#rang)',
    example: 'MAT101#CM#1',
  })
  cle: string;

  @ApiProperty({
    description: 'Valeurs de la séance par génération',
    type: [SeanceValeurDto],
  })
  generations: SeanceValeurDto[];
}

export class ConflitDiffDto {
  @ApiProperty({
    description: 'Signatures de conflits apparus (présents dans au moins une génération mais pas dans la référence)',
    type: [String],
    example: ['sig_abc123'],
  })
  conflitsApparus: string[];

  @ApiProperty({
    description: 'Signatures de conflits disparus (présents dans la référence mais absents ailleurs)',
    type: [String],
    example: ['sig_def456'],
  })
  conflitsDisparus: string[];
}

export class VerrouDiffDto {
  @ApiProperty({
    description: 'Verrous respectés par génération (index aligné sur generations)',
    type: [Boolean],
    example: [true, false],
  })
  verrousRespectes: boolean[];
}

export class CompareDiffDto {
  @ApiProperty({
    description: 'Clés de séances identiques dans toutes les générations',
    type: [String],
    example: ['MAT101#CM#1', 'PHY201#TD#2'],
  })
  seancesIdentiques: string[];

  @ApiProperty({
    description: 'Clés de séances qui diffèrent entre au moins deux générations',
    type: [String],
    example: ['MAT101#CM#3'],
  })
  seancesDifferentes: string[];

  @ApiProperty({
    description: 'Détails des séances modifiées',
    type: [ChangementSeanceDto],
  })
  changements: ChangementSeanceDto[];

  @ApiProperty({ type: ConflitDiffDto })
  conflits: ConflitDiffDto;

  @ApiProperty({ type: VerrouDiffDto })
  verrous: VerrouDiffDto;
}

export class CompareResponseDto {
  @ApiProperty({
    description: 'Résumé de chaque génération comparée',
    type: [GenerationSummaryDto],
  })
  generations: GenerationSummaryDto[];

  @ApiProperty({ type: CompareDiffDto })
  diff: CompareDiffDto;
}
