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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

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
}
