// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controleur des groupes de covoiturage (L3-41)
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CovoiturageService } from './covoiturage.service.js';
import {
  CreateCovoiturageDto,
  UpdateCovoiturageDto,
  CovoiturageResponseDto,
  CovoiturageQueryDto,
} from './dto/covoiturage.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Covoiturage')
@Controller('covoiturage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CovoiturageController {
  constructor(private readonly service: CovoiturageService) {}

  @Post()
  @Permissions('covoiturage:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un groupe de covoiturage' })
  @ApiResponse({
    status: 201,
    description: 'Groupe de covoiturage cree',
    type: CovoiturageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parametres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre ou enseignant introuvable' })
  @ApiResponse({ status: 409, description: 'Groupe de covoiturage deja existant' })
  async create(
    @Body() dto: CreateCovoiturageDto,
  ): Promise<CovoiturageResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('covoiturage:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister les groupes de covoiturage' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des groupes de covoiturage',
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAll(
    @Query() query: CovoiturageQueryDto,
  ): Promise<{
    data: CovoiturageResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('covoiturage:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un groupe de covoiturage par ID' })
  @ApiParam({ name: 'id', description: 'ID du groupe de covoiturage (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Groupe de covoiturage trouve',
    type: CovoiturageResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Groupe de covoiturage introuvable' })
  async findOne(
    @Param('id') id: string,
  ): Promise<CovoiturageResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('covoiturage:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre a jour un groupe de covoiturage' })
  @ApiParam({ name: 'id', description: 'ID du groupe de covoiturage (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Groupe de covoiturage mis a jour',
    type: CovoiturageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Parametres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Groupe de covoiturage introuvable' })
  @ApiResponse({ status: 409, description: 'Groupe de covoiturage deja existant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCovoiturageDto,
  ): Promise<CovoiturageResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('covoiturage:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un groupe de covoiturage' })
  @ApiParam({ name: 'id', description: 'ID du groupe de covoiturage (UUID)' })
  @ApiResponse({ status: 204, description: 'Groupe de covoiturage supprime' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Groupe de covoiturage introuvable' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
