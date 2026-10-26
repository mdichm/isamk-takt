// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de transition de version (L5-01)
// POST /versions/{id}/transitions
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { VersionStatut } from '@takt/db';
import type { TransitionType } from '@takt/contracts';

interface WorkflowCircuit {
  validationPlanningRequise: boolean;
  publicationRequise: boolean;
}

// ============================================
// Réponse de transition (L5-01)
// ============================================

export class TransitionResponseDto {
  @ApiProperty({ description: 'Identifiant de la version' })
  versionId: string;

  @ApiProperty({ example: '1.0', description: 'Numéro de version (majeur.mineur)' })
  numero: string;

  @ApiProperty({ description: 'Statut avant la transition' })
  de: VersionStatut;

  @ApiProperty({ description: 'Statut après la transition' })
  vers: VersionStatut;

  @ApiProperty({ description: 'Action de workflow exécutée' })
  action: TransitionType;

  @ApiProperty({ description: 'Circuit de workflow figé appliqué à la version (interrupteurs copiés depuis ParametreWorkflow)' })
  circuit: WorkflowCircuit;

  @ApiProperty({ description: 'Nouveau numéro de révision de la version' })
  revision: number;

  @ApiProperty({ description: 'Numéro du cycle de validation ouvert par cette soumission' })
  cycleValidation: number;

  @ApiPropertyOptional({ description: 'Commentaire de la transition' })
  commentaire?: string;

  @ApiProperty({ description: 'Date et heure de la transition' })
  at: Date;
}
