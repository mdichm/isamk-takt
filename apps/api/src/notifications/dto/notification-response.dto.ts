// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs de réponse de la boîte de réception (L5-23 notif_api)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Une notification de la boîte de réception d'un utilisateur.
 */
export class NotificationResponseDto {
  @ApiProperty({ description: 'Identifiant de la notification (UUID)', format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: "Type d'événement notifié" })
  @IsString()
  evenement: string;

  @ApiProperty({ description: 'Titre / sujet de la notification' })
  @IsString()
  titre: string;

  @ApiPropertyOptional({ description: 'Lien vers la ressource concernée' })
  @IsOptional()
  @IsString()
  lien: string | null;

  @ApiProperty({ description: 'La notification a-t-elle été lue ?' })
  @IsBoolean()
  lu: boolean;

  @ApiPropertyOptional({ description: 'Date/heure de marquage en lecture' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  luALe: Date | null;

  @ApiPropertyOptional({ description: 'ID de la version d\'EDT concernée (si applicable)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  versionId: string | null;

  @ApiPropertyOptional({ description: 'ID de la demande de modification concernée (si applicable)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  demandeId: string | null;

  @ApiProperty({ description: 'Date/heure de création de la notification' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

/**
 * Réponse paginée de la boîte de réception, avec le compteur de non lues.
 */
export class PaginatedNotificationDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiPropertyOptional({ nullable: true, description: 'Curseur de la page suivante (null si dernière page)' })
  nextCursor: string | null;

  @ApiProperty({ description: 'Nombre de notifications non lues de l\'utilisateur' })
  unread: number;
}
