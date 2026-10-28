// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur des jobs d'export asynchrones (L6-04)
// POST /exports, GET /exports, GET /exports/:id, GET /exports/:id/download
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
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
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { Scope } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ExportService } from './export.service.js';
import {
  CreateExportDto,
  ExportJobResponseDto,
  PaginatedExportJobsDto,
} from './dto/index.js';
import { ExportQueryDto } from './dto/export-query.dto.js';
import { SecurityEventInterceptor } from '../common/interceptors/security-event.interceptor.js';
import { SecurityEvent } from '../common/decorators/security-event.decorator.js';

interface CurrentUserDto {
  id: string;
  role: string;
  departments?: string[];
}

@ApiTags('Export (L6-04)')
@ApiBearerAuth()
@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @Permissions('export:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Lancer un export asynchrone',
    description:
      'Crée un ExportJob (statut QUEUED) et l\'enfile sur la file pg-boss. ' +
      'Les versions du style et de la vue sont enregistrées pour régénération ultérieure.',
  })
  @ApiResponse({
    status: 201,
    description: 'Job d\'export créé et enfilé',
    type: ExportJobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version, style ou vue introuvable' })
  @ApiResponse({ status: 422, description: 'Mode officiel sur une version non publiée' })
  async create(
    @Body() dto: CreateExportDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportJobResponseDto> {
    return this.exportService.create(dto, currentUser);
  }

  @Get()
  @Permissions('export:read')
  @ApiOperation({ summary: 'Liste paginée des jobs d\'export' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des jobs',
    type: PaginatedExportJobsDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'statut', required: false, enum: ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] })
  @ApiQuery({ name: 'format', required: false, enum: ['PDF', 'XLSX'] })
  @ApiQuery({ name: 'mode', required: false, enum: ['BROUILLON', 'OFFICIEL'] })
  @ApiQuery({ name: 'versionId', required: false, type: String })
  async findAll(
    @Query() query: ExportQueryDto,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<PaginatedExportJobsDto> {
    return this.exportService.findAll(query, currentUser);
  }

  @Get(':id')
  @Permissions('export:read')
  @Scope({ resource: 'export', idParam: 'id' })
  @ApiOperation({ summary: 'Détail et statut d\'un job d\'export' })
  @ApiParam({ name: 'id', description: 'Identifiant du job d\'export' })
  @ApiResponse({
    status: 200,
    description: 'Détail du job',
    type: ExportJobResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Job introuvable ou hors portée' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<ExportJobResponseDto> {
    return this.exportService.findById(id, currentUser);
  }

  @Get(':id/download')
  @Permissions('export:download')
  @Scope({ resource: 'export', idParam: 'id' })
  @UseInterceptors(SecurityEventInterceptor)
  @SecurityEvent('EXPORT_ACCESS')
  @ApiOperation({
    summary: 'Téléchargement d\'un export terminé',
    description:
      'Retourne une URL signée vers le fichier généré. L\'accès est journalisé dans le journal de sécurité.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant du job d\'export' })
  @ApiResponse({
    status: 200,
    description: 'URL signée de téléchargement',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string', example: '/filestore/...' },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Job introuvable ou hors portée' })
  @ApiResponse({ status: 409, description: 'Export pas encore terminé' })
  async download(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.exportService.download(id, currentUser);
  }
}
