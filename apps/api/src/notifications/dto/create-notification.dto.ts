import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvenementNotification } from '../notifications.constants.js';

/**
 * L5-21 notif_core — DTO de création d'une notification (une ligne par destinataire).
 * Utilisé par les use cases métier pour émettre une notification dans la transaction.
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID du destinataire (utilisateur)',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  destinataireId: string;

  @ApiProperty({
    description: 'Type d\'événement notifié',
    enum: EvenementNotification,
  })
  @IsEnum(EvenementNotification)
  evenement: EvenementNotification;

  @ApiProperty({ description: 'Titre / sujet de la notification' })
  @IsString()
  titre: string;

  @ApiPropertyOptional({
    description: 'ID de la version d\'EDT concernée (optionnel)',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  versionId?: string;

  @ApiPropertyOptional({
    description: 'ID de la demande de modification concernée (optionnel)',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  demandeId?: string;

  @ApiPropertyOptional({ description: 'Lien vers la ressource concernée' })
  @IsOptional()
  @IsString()
  lien?: string;
}