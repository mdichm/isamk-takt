// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de consultation des événements de sécurité (L0-37)
// Accès réservé aux administrateurs. Filtres et pagination par curseur.

import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsPositive,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SecurityEventService } from '../services/security-event.service.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { SecurityEvent } from '../decorators/security-event.decorator.js';
import { SecurityEventInterceptor } from '../interceptors/security-event.interceptor.js';

/**
 * Filtres de consultation des événements de sécurité.
 * Pagination par curseur (limit + cursor).
 */
class SecurityEventQueryDto {
  @ApiPropertyOptional({
    example: 'LOGIN_SUCCESS',
    description: 'Filtre par type d\'événement de sécurité',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filtre par identifiant d\'utilisateur (UUID)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    example: '2026-10-01T00:00:00Z',
    description: 'Date/heure de début (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-31T23:59:59Z',
    description: 'Date/heure de fin (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    default: 50,
    description: 'Nombre d\'entrées par page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Curseur de pagination (ID de la dernière entrée vue)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Entrée d'événement de sécurité retournée.
 */
class SecurityEventDto {
  id: string;
  at: Date;
  type: string;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
}

/**
 * Réponse paginée d'événements de sécurité.
 */
class PaginatedSecurityEventDto {
  data: SecurityEventDto[];
  nextCursor: string | null;
}

@ApiTags('Security Events')
@Controller('security-events')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SecurityEventController {
  constructor(private readonly securityEventService: SecurityEventService) {}

  @Get()
  @UseInterceptors(SecurityEventInterceptor)
  @SecurityEvent('SECURITY_READ')
  @ApiOperation({
    summary:
      'Consulter les événements de sécurité avec filtres et pagination (Administrateur uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des événements de sécurité',
    type: PaginatedSecurityEventDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({
    status: 403,
    description: 'Accès réservé aux administrateurs',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filtre par type d\'événement de sécurité',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filtre par utilisateur (UUID)',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Date/heure de début (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Date/heure de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'entrées par page (max 100)',
    default: 50,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Curseur de pagination (ID de la dernière entrée vue)',
  })
  async findAll(
    @Query() query: SecurityEventQueryDto,
  ): Promise<PaginatedSecurityEventDto> {
    const result = await this.securityEventService.findAll({
      type: query.type,
      userId: query.userId,
      from: query.from,
      to: query.to,
      limit: query.limit,
      cursor: query.cursor,
    });

    return {
      data: result.data.map((e) => ({
        id: e.id,
        at: e.at,
        type: e.type,
        userId: e.userId,
        email: e.email,
        ip: e.ip,
        userAgent: e.userAgent,
        requestId: e.requestId,
        details: e.details,
      })),
      nextCursor: result.nextCursor,
    };
  }
}
