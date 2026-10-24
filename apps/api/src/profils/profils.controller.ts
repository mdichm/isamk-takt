// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur des profils de génération (L4-10)
// POST /profils : création d'un profil de génération
// GET /profils : liste des profils d'un semestre
// GET /profils/:id : détail d'un profil
// PATCH /profils/:id : modification d'un profil (immuabilité si utilisé)
// GET /semestres/:semestreId/profils : profils d'un semestre
// POST /semestres/:semestreId/profils/defaut : définir le profil par défaut
// GET /semestres/:semestreId/profils/defaut : profil par défaut d'un semestre

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { ProfilsService } from './profils.service.js';
import {
  CreateProfilDto,
  UpdateProfilDto,
  ProfilResponseDto,
} from './dto/index.js';
import { SetDefaultProfilDto } from './dto/set-default-profil.dto.js';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('profils')
@Controller('profils')
export class ProfilsController {
  constructor(private readonly service: ProfilsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('profil:write')
  @ApiOperation({
    summary: 'Créer un profil de génération (Gestionnaire / Administrateur)',
  })
  @ApiResponse({
    status: 201,
    description: 'Profil créé',
    type: ProfilResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  @ApiBody({ type: CreateProfilDto })
  async create(
    @Body() dto: CreateProfilDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    return this.service.createProfil(dto.semestreId ?? '', dto, currentUser);
  }

  @Get('semestres/:semestreId')
  @HttpCode(HttpStatus.OK)
  @Permissions('profil:read')
  @ApiOperation({ summary: 'Lister les profils de génération d’un semestre' })
  @ApiResponse({
    status: 200,
    description: 'Liste des profils',
    type: [ProfilResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiParam({ name: 'semestreId', type: String })
  async findBySemestre(
    @Param('semestreId') semestreId: string,
  ): Promise<ProfilResponseDto[]> {
    return this.service.getProfils(semestreId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('profil:read')
  @ApiOperation({ summary: 'Détail d’un profil de génération' })
  @ApiResponse({
    status: 200,
    description: 'Détail du profil',
    type: ProfilResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Profil introuvable' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string): Promise<ProfilResponseDto> {
    return this.service.getProfil(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('profil:write')
  @ApiOperation({
    summary: 'Modifier un profil de génération (immuabilité si utilisé)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil modifié ou nouvelle version créée',
    type: ProfilResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Profil introuvable' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProfilDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProfilDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    return this.service.updateProfil(id, dto, currentUser);
  }

  @Post('semestres/:semestreId/profils/defaut')
  @HttpCode(HttpStatus.OK)
  @Permissions('profil:write')
  @ApiOperation({
    summary: 'Définir le profil par défaut d’un semestre (Gestionnaire / Administrateur)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil par défaut défini',
    type: ProfilResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Profil introuvable' })
  @ApiResponse({ status: 422, description: 'Le profil n’appartient pas au semestre' })
  @ApiParam({ name: 'semestreId', type: String })
  @ApiBody({ type: SetDefaultProfilDto })
  async setDefault(
    @Param('semestreId') semestreId: string,
    @Body() dto: SetDefaultProfilDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ProfilResponseDto> {
    return this.service.setDefaultProfil(semestreId, dto, currentUser);
  }

  @Get('semestres/:semestreId/profils/defaut')
  @HttpCode(HttpStatus.OK)
  @Permissions('profil:read')
  @ApiOperation({ summary: 'Récupérer le profil par défaut d’un semestre' })
  @ApiResponse({
    status: 200,
    description: 'Profil par défaut',
    type: ProfilResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiParam({ name: 'semestreId', type: String })
  async getDefault(
    @Param('semestreId') semestreId: string,
  ): Promise<ProfilResponseDto | null> {
    return this.service.getDefaultProfil(semestreId);
  }
}