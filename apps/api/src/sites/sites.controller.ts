// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controller du référentiel des sites (L1-14)
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SitesService } from './sites.service.js';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  PaginatedSitesDto,
  SitesQueryDto,
  SalleParSiteQueryDto,
} from './dto/site.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Sites')
@Controller('sites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Post()
  @Permissions('site:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un site' })
  @ApiResponse({ status: 201, description: 'Site créé', type: SiteResponseDto })
  @ApiResponse({ status: 409, description: 'Code de site déjà existant' })
  async create(
    @Body() dto: CreateSiteDto,
  ): Promise<SiteResponseDto> {
    return this.sitesService.createSite(dto);
  }

  @Get()
  @Permissions('site:read')
  @ApiOperation({ summary: 'Lister les sites (paginé, filtrés)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche sur code/libellé' })
  @ApiQuery({ name: 'estPrincipal', required: false, type: Boolean, description: 'Filtrer par site principal' })
  @ApiResponse({ status: 200, description: 'Liste paginée', type: PaginatedSitesDto })
  async findAll(
    @Query() query: SitesQueryDto,
  ): Promise<PaginatedSitesDto> {
    return this.sitesService.findAllSites(query);
  }

  @Get(':id')
  @Permissions('site:read')
  @ApiOperation({ summary: 'Obtenir un site par ID' })
  @ApiParam({ name: 'id', description: 'ID du site (UUID)' })
  @ApiResponse({ status: 200, description: 'Site trouvé', type: SiteResponseDto })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async findOne(
    @Param('id') id: string,
  ): Promise<SiteResponseDto> {
    return this.sitesService.findSiteById(id);
  }

  @Get(':id/salles')
  @Permissions('site:read')
  @ApiOperation({ summary: 'Lister les salles d’un site' })
  @ApiParam({ name: 'id', description: 'ID du site (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiResponse({ status: 200, description: 'Liste des salles du site', type: PaginatedSitesDto })
  async getSalles(
    @Param('id') id: string,
    @Query() query: SalleParSiteQueryDto,
  ): Promise<PaginatedSitesDto & { salleCount: number }> {
    return this.sitesService.getSallesParSite(id, query);
  }

  @Patch(':id')
  @Permissions('site:write')
  @ApiOperation({ summary: 'Mettre à jour un site' })
  @ApiParam({ name: 'id', description: 'ID du site (UUID)' })
  @ApiResponse({ status: 200, description: 'Site mis à jour', type: SiteResponseDto })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ): Promise<SiteResponseDto> {
    return this.sitesService.updateSite(id, dto);
  }

  @Post(':id/principal')
  @Permissions('site:write')
  @ApiOperation({ summary: 'Définir un site comme principal' })
  @ApiParam({ name: 'id', description: 'ID du site (UUID)' })
  @ApiResponse({ status: 200, description: 'Site principal mis à jour', type: SiteResponseDto })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async setPrincipal(
    @Param('id') id: string,
  ): Promise<SiteResponseDto> {
    return this.sitesService.setSitePrincipal(id);
  }

  @Delete(':id')
  @Permissions('site:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un site' })
  @ApiParam({ name: 'id', description: 'ID du site (UUID)' })
  @ApiResponse({ status: 204, description: 'Site supprimé' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  @ApiResponse({ status: 409, description: 'Des salles sont rattachées à ce site' })
  async remove(
    @Param('id') id: string,
  ): Promise<void> {
    return this.sitesService.removeSite(id);
  }
}