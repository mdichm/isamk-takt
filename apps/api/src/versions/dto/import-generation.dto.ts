// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de demande d'import de résultat manuel (L4-16)
// POST /versions/{id}/generations/import

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// ============================================
// Import de résultat de génération manuelle (L4-16)
// ============================================

export class ImportGenerationDto {
  @ApiProperty({
    description:
      'Empreinte SHA-256 du fichier moteur (.fet) exporté, retournée par GET /versions/{id}/generations/:genId/engine-file',
    example: 'sha256:9c1f3a2b...',
  })
  @IsString()
  fichierMoteurSha256: string;
}