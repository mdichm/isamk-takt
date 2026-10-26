// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de la boîte de notifications (L5-23 notif_api)
//
// Routes :
//   GET    /notifications          boîte de réception paginée avec compteur non lus
//   POST   /notifications/:id/read marquer une notification lue (destinataire uniquement)
//   POST   /notifications/read-all marquer toutes les notifications de l'utilisateur lues
//   GET    /notifications/events   flux SSE de mise à jour en direct

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Res,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { Response } from 'express';
import { NotificationsService } from './notifications.service.js';
import { SseNotifier } from './notifications.sse.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import {
  NotificationResponseDto,
  PaginatedNotificationDto,
} from './dto/notification-response.dto.js';

interface AuthenticatedUser {
  id: string;
  role: string;
  departments?: string[];
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseNotifier: SseNotifier,
  ) {}

  @Get()
  @Permissions('notification:read')
  @ApiOperation({
    summary: 'Consulter la boîte de réception de l\'utilisateur connecté',
    description:
      'Retourne les notifications paginées par curseur (id desc) avec le compteur de non lus.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des notifications et compteur non lus',
    type: PaginatedNotificationDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiQuery({
    name: 'lu',
    required: false,
    enum: ['true', 'false'],
    description: "Filtrer par état de lecture : 'true' (lues) ou 'false' (non lues).",
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de notifications par page (max 100)',
    default: 50,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Curseur de pagination (id de la dernière notification déjà vue)',
  })
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedNotificationDto> {
    return this.notificationsService.findAll(userId, query);
  }

  @Post(':id/read')
  @HttpCode(200)
  @Permissions('notification:read')
  @ApiOperation({
    summary: 'Marquer une notification comme lue',
    description: 'Seul le destinataire de la notification peut la marquer lue.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la notification (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Notification marquée lue',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Notification introuvable ou pas destinataire' })
  async marquerLu(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.marquerLu(userId, id);
    if (!notification) {
      throw new NotFoundException('Notification introuvable ou vous n\'en êtes pas le destinataire');
    }
    return notification;
  }

  @Post('read-all')
  @HttpCode(200)
  @Permissions('notification:read')
  @ApiOperation({
    summary: 'Marquer toutes les notifications de l\'utilisateur comme lues',
  })
  @ApiResponse({
    status: 200,
    description: 'Nombre de notifications marquées lues',
    schema: { example: { count: 3 } },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async marquerTousLus(
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    return this.notificationsService.marquerTousLus(userId);
  }

  @Get('events')
  @Permissions('notification:read')
  @ApiOperation({
    summary: 'Flux SSE de mise à jour en direct des notifications',
    description:
      'Ouvert un flux text/event-stream. Chaque nouvel événement (nouvelle notification, marquage lu) est poussé à l\'utilisateur.',
  })
  @ApiResponse({ status: 200, description: 'Flux SSE ouvert' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async events(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Heartbeat pour garder la connexion ouverte
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    const send = (data: string) => {
      try {
        res.write(data);
      } catch {
        // Client déconnecté
      }
    };

    const unsubscribe = this.sseNotifier.subscribe(userId, send);

    res.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });

    res.on('error', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  }
}
