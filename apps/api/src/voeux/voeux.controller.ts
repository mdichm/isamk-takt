// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controleur des voeux enseignants (L3-33)
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
import { VoeuxService } from './voeux.service.js';
import {
  CreateVoeuDto,
  UpdateVoeuDto,
  VoeuResponseDto,
  VoeuQueryDto,
} from './dto/voeux.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Voeux')
@Controller('voeux')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoeuxController {
  constructor(private readonly service: VoeuxService) {}

  @Post()
  @Permissions('voeu:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creer un vœu d\'enseignant' })
  @ApiResponse({ status: 201, description: 'Vœu cree', type: VoeuResponseDto })
  @ApiResponse({ status: 400, description: 'Parametres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre ou enseignant introuvable' })
  @ApiResponse({ status: 409, description: 'Vœu deja existant' })
  async create(
    @Body() dto: CreateVoeuDto,
  ): Promise<VoeuResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('voeu:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister les voeux avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des voeux' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAll(
    @Query() query: VoeuQueryDto,
  ): Promise<{
    data: VoeuResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('voeu:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtenir un vœu par ID' })
  @ApiParam({ name: 'id', description: 'ID du vœu (UUID)' })
  @ApiResponse({ status: 200, description: 'Vœu trouve', type: VoeuResponseDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Vœu introuvable' })
  async findOne(
    @Param('id') id: string,
  ): Promise<VoeuResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('voeu:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre a jour un vœu' })
  @ApiParam({ name: 'id', description: 'ID du vœu (UUID)' })
  @ApiResponse({ status: 200, description: 'Vœu mis a jour', type: VoeuResponseDto })
  @ApiResponse({ status: 400, description: 'Parametres invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Vœu introuvable' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVoeuDto,
  ): Promise<VoeuResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('voeu:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un vœu' })
  @ApiParam({ name: 'id', description: 'ID du vœu (UUID)' })
  @ApiResponse({ status: 204, description: 'Vœu supprime' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Vœu introuvable' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}