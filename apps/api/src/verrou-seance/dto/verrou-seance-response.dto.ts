// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'un verrou de séance (L3-36)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { VerrouType } from '@takt/db';

/**
 * Représentation d'un verrou sur une séance (actif ou levé).
 */
export class VerrouSeanceResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant du verrou',
  })
  @IsString()
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de la version',
  })
  @IsString()
  versionId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de la séance verrouillée',
  })
  @IsString()
  seanceId: string;

  @ApiProperty({
    enum: ['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'],
    description: 'Type de verrou',
  })
  @IsEnum(['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'])
  type: VerrouType;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de l\'auteur de la pose',
  })
  @IsString()
  auteurId: string;

  @ApiPropertyOptional({
    example: 'Réservation salle pour examen',
    description: 'Justification facultative de la pose',
  })
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiProperty({
    example: '2026-10-22T10:00:00Z',
    description: 'Date et heure de la pose',
  })
  @IsDate()
  @Type(() => Date)
  creeLe: Date;

  @ApiPropertyOptional({
    example: '2026-10-22T11:00:00Z',
    description: 'Date et heure de la levée (null si actif)',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  leveLe?: Date;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de l\'utilisateur ayant levé le verrou (null si actif)',
  })
  @IsOptional()
  @IsString()
  levePar?: string;

  static fromPrisma(prisma: {
    id: string;
    versionId: string;
    seanceId: string;
    type: string;
    auteurId: string;
    justification: string | null;
    creeLe: Date;
    leveLe: Date | null;
    levePar: string | null;
  }): VerrouSeanceResponseDto {
    const dto = new VerrouSeanceResponseDto();
    dto.id = prisma.id;
    dto.versionId = prisma.versionId;
    dto.seanceId = prisma.seanceId;
    dto.type = prisma.type as VerrouType;
    dto.auteurId = prisma.auteurId;
    dto.justification = prisma.justification ?? undefined;
    dto.creeLe = prisma.creeLe;
    dto.leveLe = prisma.leveLe ?? undefined;
    dto.levePar = prisma.levePar ?? undefined;
    return dto;
  }
}
