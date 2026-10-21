import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RepartitionsService } from './repartitions.service.js';
import {
  CreateRepartitionDto,
  UpdateRepartitionDto,
  RepartitionResponseDto,
  PaginatedRepartitionsDto,
  RepartitionQueryDto,
} from './dto/repartition.dto.js';
import {
  CreateAffectationDto,
  UpdateAffectationDto,
  AffectationResponseDto,
  PaginatedAffectationsDto,
  AffectationQueryDto,
} from './dto/affectation.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { Scope } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Répartitions')
@Controller('repartitions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RepartitionsController {
  constructor(private repartitionsService: RepartitionsService) {}

  @Post()
  @Permissions('repartition:write')
  @ApiOperation({ summary: 'Créer une répartition (semestre + département)' })
  @ApiResponse({ status: 201, description: 'Répartition créée', type: RepartitionResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 404, description: 'Semestre ou département introuvable' })
  @ApiResponse({ status: 409, description: 'Répartition déjà existante pour ce (semestre, département)' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async createRepartition(
    @Body() dto: CreateRepartitionDto,
  ): Promise<RepartitionResponseDto> {
    return this.repartitionsService.createRepartition(dto, 'system');
  }

  @Get()
  @Permissions('repartition:read')
  @ApiOperation({ summary: 'Lister les répartitions avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des répartitions', type: PaginatedRepartitionsDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAllRepartitions(
    @Query() query: RepartitionQueryDto,
  ): Promise<PaginatedRepartitionsDto> {
    return this.repartitionsService.findAllRepartitions(query);
  }

  @Get(':id')
  @Permissions('repartition:read')
  @ApiOperation({ summary: 'Obtenir une répartition par ID' })
  @ApiParam({ name: 'id', description: 'ID de la répartition (UUID)' })
  @ApiResponse({ status: 200, description: 'Répartition trouvée', type: RepartitionResponseDto })
  @ApiResponse({ status: 404, description: 'Répartition non trouvée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findRepartitionById(
    @Param('id') id: string,
  ): Promise<RepartitionResponseDto> {
    return this.repartitionsService.findRepartitionById(id);
  }

  @Patch(':id')
  @Permissions('repartition:write')
  @ApiOperation({ summary: 'Mettre à jour une répartition' })
  @ApiParam({ name: 'id', description: 'ID de la répartition (UUID)' })
  @ApiResponse({ status: 200, description: 'Répartition mise à jour', type: RepartitionResponseDto })
  @ApiResponse({ status: 404, description: 'Répartition non trouvée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async updateRepartition(
    @Param('id') id: string,
    @Body() dto: UpdateRepartitionDto,
  ): Promise<RepartitionResponseDto> {
    return this.repartitionsService.updateRepartition(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('repartition:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une répartition' })
  @ApiParam({ name: 'id', description: 'ID de la répartition (UUID)' })
  @ApiResponse({ status: 204, description: 'Répartition supprimée' })
  @ApiResponse({ status: 404, description: 'Répartition non trouvée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async removeRepartition(@Param('id') id: string): Promise<void> {
    return this.repartitionsService.removeRepartition(id, 'system');
  }

  // ============================================
  // Affectations (L2-07) — routes imbriquées sous /repartitions/:repartitionId/affectations
  // ============================================

  @Post(':repartitionId/affectations')
  @Permissions('repartition:write')
  @Scope({ resource: 'repartition', idParam: 'repartitionId' })
  @ApiOperation({ summary: 'Créer une affectation dans une répartition' })
  @ApiParam({ name: 'repartitionId', description: 'ID de la répartition (UUID)' })
  @ApiResponse({ status: 201, description: 'Affectation créée', type: AffectationResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Répartition, enseignant, module, type ou groupe introuvable' })
  @ApiResponse({ status: 409, description: 'Affectation en doublon' })
  @ApiResponse({ status: 422, description: 'Enseignant inactif ou module hors niveau' })
  async createAffectation(
    @Param('repartitionId') repartitionId: string,
    @Body() dto: CreateAffectationDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AffectationResponseDto> {
    return this.repartitionsService.createAffectation(repartitionId, dto, currentUser);
  }

  @Get(':repartitionId/affectations')
  @Permissions('repartition:read')
  @Scope({ resource: 'repartition', idParam: 'repartitionId' })
  @ApiOperation({ summary: 'Lister les affectations d\'une répartition' })
  @ApiParam({ name: 'repartitionId', description: 'ID de la répartition (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des affectations', type: PaginatedAffectationsDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAllAffectations(
    @Param('repartitionId') repartitionId: string,
    @Query() query: AffectationQueryDto,
  ): Promise<PaginatedAffectationsDto> {
    return this.repartitionsService.findAllAffectations(repartitionId, query);
  }

  @Get(':repartitionId/affectations/:id')
  @Permissions('repartition:read')
  @Scope({ resource: 'repartition', idParam: 'repartitionId' })
  @ApiOperation({ summary: 'Obtenir une affectation par ID' })
  @ApiParam({ name: 'repartitionId', description: 'ID de la répartition (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de l\'affectation (UUID)' })
  @ApiResponse({ status: 200, description: 'Affectation trouvée', type: AffectationResponseDto })
  @ApiResponse({ status: 404, description: 'Affectation non trouvée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAffectationById(
    @Param('repartitionId') repartitionId: string,
    @Param('id') id: string,
  ): Promise<AffectationResponseDto> {
    return this.repartitionsService.findAffectationById(id);
  }

  @Patch(':repartitionId/affectations/:id')
  @Permissions('repartition:write')
  @Scope({ resource: 'repartition', idParam: 'repartitionId' })
  @ApiOperation({ summary: 'Mettre à jour une affectation' })
  @ApiParam({ name: 'repartitionId', description: 'ID de la répartition (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de l\'affectation (UUID)' })
  @ApiResponse({ status: 200, description: 'Affectation mise à jour', type: AffectationResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Affectation non trouvée' })
  @ApiResponse({ status: 409, description: 'Affectation en doublon' })
  @ApiResponse({ status: 422, description: 'Enseignant inactif ou module hors niveau' })
  async updateAffectation(
    @Param('repartitionId') repartitionId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAffectationDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AffectationResponseDto> {
    return this.repartitionsService.updateAffectation(id, dto, currentUser);
  }

  @Delete(':repartitionId/affectations/:id')
  @Permissions('repartition:write')
  @Scope({ resource: 'repartition', idParam: 'repartitionId' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une affectation' })
  @ApiParam({ name: 'repartitionId', description: 'ID de la répartition (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de l\'affectation (UUID)' })
  @ApiResponse({ status: 204, description: 'Affectation supprimée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Affectation non trouvée' })
  async removeAffectation(
    @Param('repartitionId') repartitionId: string,
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<void> {
    return this.repartitionsService.removeAffectation(id, currentUser);
  }
}
