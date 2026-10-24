// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controleur des exigences de salle par activité (L3-43)
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ExigencesSalleService } from './exigences-salle.service.js';
import {
  CreateExigenceSalleActiviteDto,
  UpdateExigenceSalleActiviteDto,
  ExigenceSalleActiviteResponseDto,
  ExigenceSalleQueryDto,
} from './dto/exigences-salle.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Exigences de salle')
@Controller('exigences-salle')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExigencesSalleController {
  constructor(private readonly service: ExigencesSalleService) {}

  @Post()
  @Permissions('exigence-salle:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une exigence de salle par activité' })
  @ApiResponse({
    status: 201,
    description: 'Exigence de salle créée',
    type: ExigenceSalleActiviteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre ou salle introuvable' })
  @ApiResponse({ status: 409, description: 'Exigence déjà existante' })
  async create(
    @Body() dto: CreateExigenceSalleActiviteDto,
    @Request() req: { user: { id: string } },
  ): Promise<ExigenceSalleActiviteResponseDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Permissions('exigence-salle:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister les exigences de salle' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des exigences de salle',
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAll(
    @Query() query: ExigenceSalleQueryDto,
  ): Promise<{
    data: ExigenceSalleActiviteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('exigence-salle:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir une exigence de salle par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'exigence de salle (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Exigence de salle trouvée',
    type: ExigenceSalleActiviteResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Exigence de salle introuvable' })
  async findOne(
    @Param('id') id: string,
  ): Promise<ExigenceSalleActiviteResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('exigence-salle:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une exigence de salle' })
  @ApiParam({ name: 'id', description: 'ID de l\'exigence de salle (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Exigence de salle mise à jour',
    type: ExigenceSalleActiviteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Exigence de salle ou salle introuvable' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExigenceSalleActiviteDto,
  ): Promise<ExigenceSalleActiviteResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('exigence-salle:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une exigence de salle' })
  @ApiParam({ name: 'id', description: 'ID de l\'exigence de salle (UUID)' })
  @ApiResponse({ status: 204, description: 'Exigence de salle supprimée' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Exigence de salle introuvable' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
