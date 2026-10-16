// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du service d'audit métier (EX-AUD-01, ST §2.4, §0.5)

import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Données d'entrée pour écrire une entrée d'audit métier.
 * L'audit contient l'ancienne et la nouvelle valeur de l'objet modifié.
 */
export class WriteAuditDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de l\'utilisateur ayant déclenché l\'action',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    example: 'CREATE',
    description: "Type d'action métier (ex: 'CREATE', 'UPDATE', 'DELETE', 'VALIDATE')",
  })
  @IsString()
  action: string;

  @ApiProperty({
    example: 'User',
    description: 'Type de l\'objet concerné',
  })
  @IsString()
  objetType: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de l\'objet concerné',
  })
  @IsUUID()
  objetId: string;

  @ApiPropertyOptional({
    example: { email: 'old@example.com' },
    description: 'Valeur avant modification (ancienne valeur)',
  })
  @IsOptional()
  @IsObject()
  ancienneValeur?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { email: 'new@example.com' },
    description: 'Valeur après modification (nouvelle valeur)',
  })
  @IsOptional()
  @IsObject()
  nouvelleValeur?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant de version liée (si applicable)',
  })
  @IsOptional()
  @IsUUID()
  versionId?: string;

  @ApiPropertyOptional({
    example: 'Passage en production',
    description: 'Motif facultatif de l\'action',
  })
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiPropertyOptional({
    example: 'req_123456',
    description: 'Identifiant de requête pour corrélation avec les logs techniques',
  })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({
    example: '192.168.1.42',
    description: 'Adresse IP de l\'utilisateur',
  })
  @IsOptional()
  @IsString()
  ip?: string;
}

/**
 * Entrée d'audit métier retournée après écriture.
 */
export class AuditEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  at: Date;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiProperty()
  action: string;

  @ApiProperty()
  objetType: string;

  @ApiProperty()
  objetId: string;

  @ApiPropertyOptional()
  ancienneValeur: Record<string, unknown> | null;

  @ApiPropertyOptional()
  nouvelleValeur: Record<string, unknown> | null;

  @ApiPropertyOptional()
  versionId: string | null;

  @ApiPropertyOptional()
  motif: string | null;

  @ApiPropertyOptional()
  requestId: string | null;

  @ApiPropertyOptional()
  ip: string | null;
}
