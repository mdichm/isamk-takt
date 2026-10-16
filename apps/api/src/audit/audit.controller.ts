// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de consultation de l'audit métier (L0-18)

import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { AuditQueryDto, PaginatedAuditDto } from './dto/audit-query.dto.js';
import { AuditEntryDto } from './dto/audit.dto.js';
import type { User } from '@takt/db';

interface AuthenticatedUser {
  id: string;
  role: string;
  departments?: string[];
}

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit:read')
  @ApiOperation({ summary: 'Consulter les entrées d\'audit métier avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des entrées d\'audit', type: PaginatedAuditDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiQuery({ name: 'objetType', required: false, type: String, description: 'Filtre par type d\'objet audité' })
  @ApiQuery({ name: 'objetId', required: false, type: String, description: 'Filtre par identifiant d\'objet audité (UUID)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filtre par utilisateur ayant déclenché l\'action' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Date/heure de début (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Date/heure de fin (ISO 8601)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'entrées par page (max 100)', default: 50 })
  @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Curseur de pagination (ID de la dernière entrée vue)' })
  async findAll(
    @Query() query: AuditQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedAuditDto> {
    const result = await this.auditService.findAll(
      {
        objetType: query.objetType,
        objetId: query.objetId,
        userId: query.userId,
        from: query.from,
        to: query.to,
        limit: query.limit,
        cursor: query.cursor,
      },
      { id: user.id, role: user.role, departments: user.departments },
    );

    return {
      data: result.data,
      nextCursor: result.nextCursor,
    };
  }
}
