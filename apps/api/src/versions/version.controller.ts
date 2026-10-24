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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { VersionService } from './version.service.js';
import { VersionResponseDto } from './dto/version-response.dto.js';
import { CompletudeResponseDto } from './dto/completude-response.dto.js';
import { PerimetreResponseDto } from './dto/perimetre-response.dto.js';
import type { CreateVersionDto } from './dto/create-version.dto.js';
import type { CreateGenerationDto } from './dto/create-generation.dto.js';
import { GenerationResponseDto } from './dto/generation-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

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

  @Get(':id/perimetre')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Perimetre fige et empreinte d une version (L4-13)' })
  @ApiParam({ name: 'id', description: 'ID de la version (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Périmètre figé du semestre avec son empreinte',
    type: PerimetreResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async perimetre(@Param('id') id: string): Promise<PerimetreResponseDto> {
    return this.service.getPerimetre(id);
  }

  @Post(':id/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('generation:launch')
  @ApiOperation({
    summary: 'Lancer une génération d emploi du temps',
    description:
      "Lance une génération en statut QUEUED après pré-validation synchrone (préparation, verrous, contraintes, empreinte du périmètre). Retourne 202 ACCEPTED.",
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la version (UUID)' })
  @ApiResponse({
    status: 202,
    description: 'Génération créée et mise en file d attente',
    type: GenerationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiResponse({
    status: 409,
    description:
      "L'empreinte du périmètre ne correspond plus aux données actuelles (PERIMETER_CHANGED) ou une génération est déjà en cours (GENERATION_ALREADY_RUNNING)",
  })
  @ApiResponse({
    status: 422,
    description:
      'Préparation non conforme (PREPARATION_BLOCKED), verrou incompatible (LOCK_INCOMPATIBLE) ou contraintes non traduites sans acquittement (UNTRANSLATED_CONSTRAINTS_UNACKNOWLEDGED)',
  })
  @ApiResponse({
    status: 423,
    description:
      'Version immuable (VERSION_IMMUTABLE) ou bail d edition détenu (EDIT_LOCK_HELD)',
  })
  async createGeneration(
    @Param('id') id: string,
    @Body() dto: CreateGenerationDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<GenerationResponseDto> {
    return this.service.createGeneration(id, dto, currentUser.id);
  }
}
