// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs pour le droit d'accès et de rectification (L7-12, EX-NFR-06)

import { IsString, IsOptional, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Données personnelles d'un utilisateur (droit d'accès).
 */
export class MesDonneesDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'jean.dupont@isamk.rnu.tn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  prenom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actif?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedAt?: Date;
}

/**
 * Données de sécurité liées à un utilisateur (droit d'accès).
 */
export class DonneesSecuriteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  at: Date;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  ip?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiPropertyOptional()
  requestId?: string;
}

/**
 * Jobs d'export liés à un utilisateur (droit d'accès).
 */
export class DonneesExportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  versionId: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  mode: string;

  @ApiProperty()
  statut: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  finishedAt?: Date;
}

/**
 * Résultat complet d'export des données personnelles (droit d'accès).
 */
export class ExportMesDonneesDto {
  @ApiProperty({ type: MesDonneesDto })
  profil: MesDonneesDto;

  @ApiProperty({ type: [DonneesSecuriteDto] })
  securite: DonneesSecuriteDto[];

  @ApiProperty({ type: [DonneesExportDto] })
  exports: DonneesExportDto[];
}

/**
 * Données à rectifier (droit de rectification).
 */
export class RectificationDto {
  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ example: 'Dupont' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@isamk.rnu.tn' })
  @IsOptional()
  @IsEmail()
  email?: string;
}