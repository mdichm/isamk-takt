// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur ExportView (L6-03)
// CRUD des configurations de vue d'export versionnées, réservé à l'Administrateur et au Gestionnaire.
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@takt/db';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ExportViewService } from './export-view.service.js';
import {
  CreateExportViewDto,
  UpdateExportViewDto,
  ExportViewResponseDto,
  PaginatedExportViewsDto,
} from './dto/index.js';
import { ExportViewQueryDto } from './dto/export-view-query.dto.js';

interface CurrentUserDto {
  id: string;
  role: string;
  departments?: string[];
}

@ApiTags('Export View (L6-03)')
@Controller('export-views')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportViewController {
  constructor(private readonly exportView: ExportViewService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Liste paginée des vues d\'export' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des vues',
    type: PaginatedExportViewsDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'libelle', required: false, type: String })
  @ApiQuery({ name: 'vue', required: false, type: String })
  @ApiQuery({ name: 'format', required: false, type: String })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  async findAll(
    @Query() query: ExportViewQueryDto,
  ): Promise<PaginatedExportViewsDto> {
    return this.exportView.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Détail d\'une vue d\'export' })
  @ApiParam({ name: 'id', description: 'Identifiant de la vue' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la vue',
    type: ExportViewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vue non trouvée' })
  async findById(@Param('id') id: string): Promise<ExportViewResponseDto> {
    return this.exportView.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer une vue d\'export (Admin/Gestionnaire)' })
  @ApiResponse({
    status: 201,
    description: 'Vue créée',
    type: ExportViewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur et au Gestionnaire' })
  async create(
    @Body() dto: CreateExportViewDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportViewResponseDto> {
    return this.exportView.create(dto, currentUser.id, currentUser.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour une vue d\'export (Admin/Gestionnaire)' })
  @ApiParam({ name: 'id', description: 'Identifiant de la vue' })
  @ApiResponse({
    status: 200,
    description: 'Vue mise à jour',
    type: ExportViewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou vue déjà utilisée' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur et au Gestionnaire' })
  @ApiResponse({ status: 404, description: 'Vue non trouvée' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExportViewDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportViewResponseDto> {
    return this.exportView.update(id, dto, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Supprimer une vue d\'export (Admin/Gestionnaire)' })
  @ApiParam({ name: 'id', description: 'Identifiant de la vue' })
  @ApiResponse({ status: 204, description: 'Vue supprimée' })
  @ApiResponse({ status: 400, description: 'Vue déjà utilisée (CONFIG_IN_USE)' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur et au Gestionnaire' })
  @ApiResponse({ status: 404, description: 'Vue non trouvée' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<void> {
    return this.exportView.remove(id, currentUser.role);
  }
}