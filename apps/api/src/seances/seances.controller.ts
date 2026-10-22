// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de consultation des séances (L3-11)
// GET /versions/{id}/seances, GET /seances/{id}
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { SeancesService } from './seances.service.js';
import type { SeanceQueryDto } from './dto/seance-query.dto.js';
import { SeanceResponseDto } from './dto/seance-response.dto.js';
import { PaginatedSeancesDto } from './dto/seance-query.dto.js';
import { SimulateSeanceService } from './simulate-seance.service.js';
import {
  SimulatePlacementDto,
  SimulatePlacementResponseDto,
} from './dto/simulate-placement.dto.js';

// ============================================
// Seance (L3-11)
// GET /versions/{id}/seances — liste paginée des séances d'une version
// GET /seances/{id} — détail d'une séance avec ses occupations
// ============================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('seances')
@Controller('seances')
export class SeancesController {
  constructor(
    private readonly service: SeancesService,
    private readonly simulateService: SimulateSeanceService,
  ) {}

  @Get('versions/:versionId/seances')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Lister les séances d\'une version (paginé, filtres)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des séances',
    type: PaginatedSeancesDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'statut', required: false, enum: ['NON_PLACEE', 'PLACEE'] })
  @ApiQuery({ name: 'jour', required: false, type: String })
  @ApiQuery({ name: 'groupeId', required: false, type: String })
  @ApiQuery({ name: 'enseignantId', required: false, type: String })
  @ApiQuery({ name: 'salleId', required: false, type: String })
  @ApiQuery({ name: 'affectationKey', required: false, type: String })
  async listByVersion(
    @Param('versionId') versionId: string,
    @Query() query: SeanceQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedSeancesDto> {
    const result = await this.service.findSeancesByVersion(
      versionId,
      query,
      currentUser,
    );
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Détail d\'une séance avec ses occupations' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la séance',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.service.findSeanceById(id, currentUser);
  }

  @Post(':id/placement:simulate')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary:
      'Simulation de placement sans écriture en base (L3-21). Retourne les conflits respectés/violés et les impacts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la simulation de placement',
    type: SimulatePlacementResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  async simulatePlacement(
    @Param('id') id: string,
    @Body() dto: SimulatePlacementDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SimulatePlacementResponseDto> {
    return this.simulateService.simulate(id, dto, currentUser);
  }
}
