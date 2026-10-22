// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur des verrous de séance (L3-36)
// POST /versions/{id}/seances/{seanceId}/verrous
// DELETE /versions/{id}/seances/{seanceId}/verrous
// GET /versions/{id}/seances/{seanceId}/verrous

import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { VerrouSeanceService } from './verrou-seance.service.js';
import { PoseVerrouDto } from './dto/pose-verrou.dto.js';
import { VerrouSeanceResponseDto } from './dto/verrou-seance-response.dto.js';
import { VerrouType } from '@takt/db';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('verrous-seance')
@Controller('versions/:versionId/seances/:seanceId/verrous')
export class VerrouSeanceController {
  constructor(private readonly service: VerrouSeanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('verrou:write')
  @ApiOperation({
    summary: 'Pose un verrou sur une séance (Gestionnaire / Administrateur)',
  })
  @ApiResponse({
    status: 201,
    description: 'Verrou posé',
    type: VerrouSeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable' })
  @ApiResponse({ status: 423, description: 'Verrou déjà actif sur cette séance' })
  @ApiParam({ name: 'versionId', type: String })
  @ApiParam({ name: 'seanceId', type: String })
  @ApiBody({ type: PoseVerrouDto })
  async pose(
    @Param('versionId') versionId: string,
    @Param('seanceId') seanceId: string,
    @Body() dto: PoseVerrouDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    return this.service.pose(
      seanceId,
      dto.type,
      currentUser.id,
      dto.justification,
      currentUser,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @Permissions('verrou:write')
  @ApiOperation({
    summary: 'Leve le verrou actif sur une séance (Gestionnaire / Administrateur)',
  })
  @ApiResponse({
    status: 200,
    description: 'Verrou levé',
    type: VerrouSeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Aucun verrou actif sur cette séance' })
  @ApiParam({ name: 'versionId', type: String })
  @ApiParam({ name: 'seanceId', type: String })
  @ApiQuery({ name: 'type', enum: ['CRENEAU', 'SALLE', 'ENSEIGNANT', 'ACTIVITE'] })
  async leve(
    @Param('versionId') versionId: string,
    @Param('seanceId') seanceId: string,
    @Query('type') type: string,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VerrouSeanceResponseDto> {
    return this.service.leve(seanceId, type as VerrouType, currentUser.id, currentUser);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Liste tous les verrous (actifs et levés) d\'une séance',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des verrous de la séance',
    type: [VerrouSeanceResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable' })
  @ApiParam({ name: 'versionId', type: String })
  @ApiParam({ name: 'seanceId', type: String })
  async lister(
    @Param('versionId') versionId: string,
    @Param('seanceId') seanceId: string,
  ): Promise<VerrouSeanceResponseDto[]> {
    return this.service.lister(seanceId);
  }
}
