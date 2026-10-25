// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO d'historique de version (L5-09)
// GET /versions/{id}/history
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import type { VersionStatut } from '@takt/db';

// ============================================
// Entrée d'historique de version (L5-09)
// ============================================

export class HistoryEntryDto {
  @ApiProperty({ description: 'Identifiant de la transition' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Statut avant la transition' })
  de: VersionStatut;

  @ApiProperty({ description: 'Statut après la transition' })
  vers: VersionStatut;

  @ApiProperty({ description: "Action de workflow exécutée (inférée de de -> vers)" })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Identifiant de l auteur de la transition' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nom complet de l auteur' })
  @IsString()
  userName: string;

  @ApiProperty({ description: "Transition automatique ou manuelle" })
  automatique: boolean;

  @ApiPropertyOptional({ description: 'Motif ou commentaire de la transition' })
  @IsOptional()
  @IsString()
  commentaire?: string | null;

  @ApiProperty({ description: 'Date et heure de la transition' })
  @IsDate()
  at: Date;
}

// ============================================
// Réponse d historique de version (L5-09)
// ============================================

export class HistoryResponseDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'Chronologie des transitions, triée par date décroissante', type: [HistoryEntryDto] })
  entries: HistoryEntryDto[];
}
