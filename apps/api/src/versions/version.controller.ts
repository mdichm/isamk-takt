// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de création de version (L3-09)
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { VersionService } from './version.service.js';
import { VersionResponseDto } from './dto/version-response.dto.js';
import { CompletudeResponseDto } from './dto/completude-response.dto.js';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

// ============================================
// Version (L3-09)
// POST /versions : création d'une version de travail à partir des snapshots validés.
// ============================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('versions')
@Controller('versions')
export class VersionController {
  constructor(private readonly service: VersionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('version:create')
  @ApiOperation({ summary: 'Créer une version de travail pour un semestre' })
  @ApiResponse({
    status: 201,
    description: 'Version créée',
    type: VersionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  @ApiResponse({
    status: 404,
    description: 'Semestre introuvable',
  })
  @ApiResponse({
    status: 409,
    description: 'Une version de travail existe déjà pour ce semestre',
  })
  @ApiResponse({
    status: 422,
    description: 'Un département n\'a pas de snapshot validé',
  })
  async create(
    @Body() dto: CreateVersionDto,
  ): Promise<VersionResponseDto> {
    return this.service.createVersion(dto, 'system');
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Lister toutes les versions' })
  @ApiResponse({
    status: 200,
    description: 'Liste des versions',
    type: [VersionResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async findAll(): Promise<VersionResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Détail d\'une version' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la version',
    type: VersionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async findOne(@Param('id') id: string): Promise<VersionResponseDto> {
    return this.service.findOne(id);
  }

  @Get(':id/completude')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Couverture et complétude d\'une version' })
  @ApiResponse({
    status: 200,
    description: 'Couverture de la version',
    type: CompletudeResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async completude(@Param('id') id: string): Promise<CompletudeResponseDto> {
    return this.service.getCompletude(id);
  }
}
