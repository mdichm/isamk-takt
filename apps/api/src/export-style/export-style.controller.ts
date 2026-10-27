// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur ExportStyle (L6-02)
// CRUD des modèles visuels d'export versionnés, réservé à l'Administrateur.
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
import { UserRole, RoleCode } from '@takt/db';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ExportStyleService } from './export-style.service.js';
import {
  CreateExportStyleDto,
  UpdateExportStyleDto,
  ExportStyleResponseDto,
  PaginatedExportStylesDto,
} from './dto/index.js';
import { ExportStyleQueryDto } from './dto/export-style-query.dto.js';

interface CurrentUserDto {
  id: string;
  role: string;
  departments?: string[];
}

@ApiTags('Export Style (L6-02)')
@Controller('export-styles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportStyleController {
  constructor(private readonly exportStyle: ExportStyleService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Liste paginée des styles d\'export' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des styles',
    type: PaginatedExportStylesDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'libelle', required: false, type: String })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  async findAll(
    @Query() query: ExportStyleQueryDto,
  ): Promise<PaginatedExportStylesDto> {
    return this.exportStyle.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Détail d\'un style d\'export' })
  @ApiParam({ name: 'id', description: 'Identifiant du style' })
  @ApiResponse({
    status: 200,
    description: 'Détail du style',
    type: ExportStyleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Style non trouvé' })
  async findById(@Param('id') id: string): Promise<ExportStyleResponseDto> {
    return this.exportStyle.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un style d\'export (Admin uniquement)' })
  @ApiResponse({
    status: 201,
    description: 'Style créé',
    type: ExportStyleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur' })
  async create(
    @Body() dto: CreateExportStyleDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportStyleResponseDto> {
    return this.exportStyle.create(dto, currentUser.id, currentUser.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un style d\'export (Admin uniquement)' })
  @ApiParam({ name: 'id', description: 'Identifiant du style' })
  @ApiResponse({
    status: 200,
    description: 'Style mis à jour',
    type: ExportStyleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou style déjà utilisé' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur' })
  @ApiResponse({ status: 404, description: 'Style non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExportStyleDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportStyleResponseDto> {
    return this.exportStyle.update(id, dto, currentUser.id, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un style d\'export (Admin uniquement)' })
  @ApiParam({ name: 'id', description: 'Identifiant du style' })
  @ApiResponse({ status: 204, description: 'Style supprimé' })
  @ApiResponse({ status: 400, description: 'Style déjà utilisé (CONFIG_IN_USE)' })
  @ApiResponse({ status: 403, description: 'Réservé à l\'Administrateur' })
  @ApiResponse({ status: 404, description: 'Style non trouvé' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<void> {
    return this.exportStyle.remove(id, currentUser.role);
  }
}