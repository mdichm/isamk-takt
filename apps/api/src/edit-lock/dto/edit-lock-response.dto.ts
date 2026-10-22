// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse du bail d'édition (L3-19)

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Réponse de l'acquisition ou du renouvellement d'un bail d'édition sur une version.
 */
export class EditLockResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de la version verrouillée',
  })
  @IsString()
  versionId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de l\'utilisateur détenteur du bail',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    example: '2026-10-22T10:30:00Z',
    description: 'Date et heure d\'expiration du bail',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date;
}
