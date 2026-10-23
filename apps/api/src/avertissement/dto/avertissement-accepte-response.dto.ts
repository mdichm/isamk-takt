// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse d'un avertissement accepté (L3-39)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDate, IsOptional, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Impact d'un avertissement accepté : séances et ressources concernées,
 * règle et message du conflit d'origine (ST §4.15, point 1).
 */
export class AvertissementImpactDto {
  @ApiProperty({
    type: [String],
    description: 'Identifiants des séances impliquées dans le conflit',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  seanceIds: string[];

  @ApiProperty({
    example: 'SALLE_SOUHAITE_MANQUANT',
    description: 'Code de la règle à l origine de l avertissement',
  })
  @IsString()
  regleCode: string;

  @ApiProperty({
    example: 'Équipement souhaité manquant',
    description: 'Message du conflit d origine',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: { equipements: ['VIDEOPROJECTEUR'] },
    description: 'Détails contextuels du conflit',
  })
  @IsOptional()
  details?: Record<string, unknown>;
}

/**
 * Représentation d'un avertissement accepté (AvertissementAccepte).
 */
export class AvertissementAccepteResponseDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsUUID()
  versionId: string;

  @ApiProperty()
  @IsString()
  regleCode: string;

  @ApiProperty()
  @IsString()
  signature: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  seanceIds: string[];

  @ApiProperty()
  @IsUUID()
  auteurId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiProperty()
  versionRevision: number;

  @ApiProperty()
  @IsUUID()
  acceptePar: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  accepteLe: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  caduqueLe?: Date;

  @ApiProperty({ type: AvertissementImpactDto })
  impact: AvertissementImpactDto;

  static fromPrisma(
    prisma: {
      id: string;
      versionId: string;
      regleCode: string;
      signature: string;
      seanceIds: string[];
      auteurId: string;
      justification: string | null;
      versionRevision: number;
      acceptePar: string;
      accepteLe: Date;
      caduqueLe: Date | null;
    },
    impact: AvertissementImpactDto,
  ): AvertissementAccepteResponseDto {
    const dto = new AvertissementAccepteResponseDto();
    dto.id = prisma.id;
    dto.versionId = prisma.versionId;
    dto.regleCode = prisma.regleCode;
    dto.signature = prisma.signature;
    dto.seanceIds = prisma.seanceIds;
    dto.auteurId = prisma.auteurId;
    dto.justification = prisma.justification ?? undefined;
    dto.versionRevision = prisma.versionRevision;
    dto.acceptePar = prisma.acceptePar;
    dto.accepteLe = prisma.accepteLe;
    dto.caduqueLe = prisma.caduqueLe ?? undefined;
    dto.impact = impact;
    return dto;
  }
}
