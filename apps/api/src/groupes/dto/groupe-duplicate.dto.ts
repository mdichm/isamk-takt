// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de duplication de groupes d'un semestre à l'autre (L1-08)
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupeResponseDto } from './groupe.dto.js';

export class DuplicateGroupesDto {
  @ApiProperty({ description: 'ID du semestre source à dupliquer' })
  @IsUUID()
  sourceSemestreId: string;

  @ApiProperty({ description: 'ID du semestre cible de la duplication' })
  @IsUUID()
  cibleSemestreId: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Réinitialiser les effectifs à 0 (un avertissement est émis par groupe)',
  })
  @IsOptional()
  @IsBoolean()
  reinitialiserEffectifs?: boolean;
}

export class DuplicateGroupesConflict {
  @ApiProperty({
    description:
      'Code du groupe déjà présent dans le semestre cible (bloquant)',
    example: 'INFO-L3-S1',
  })
  code: string;

  @ApiProperty({ description: 'ID du groupe source concerné' })
  sourceGroupeId: string;

  @ApiProperty({
    description:
      'ID du groupe cible déjà existant avec ce code (sans originId correspondant)',
  })
  existingGroupeId: string;
}

export class DuplicateGroupesResult {
  @ApiProperty({
    type: [GroupeResponseDto],
    description: 'Groupes créés dans le semestre cible',
  })
  crees: GroupeResponseDto[];

  @ApiProperty({
    type: [GroupeResponseDto],
    description:
      'Groupes déjà dupliqués (idempotence via originId) et donc ignorés',
  })
  ignorés: GroupeResponseDto[];

  @ApiProperty({
    type: [String],
    description: 'Avertissements métier (ex: effectifs réinitialisés à 0)',
  })
  avertissements: string[];

  @ApiPropertyOptional({
    type: [DuplicateGroupesConflict],
    description:
      "Conflits de code détectés (aucune création n'est effectuée en cas de conflit)",
  })
  conflits?: DuplicateGroupesConflict[];
}
