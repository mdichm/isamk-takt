// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controller compatibilité (salle/tag, exigences d'équipement) — L1-11

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
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CompatService } from './compat.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreateSalleActivityTagDto,
  SalleActivityTagResponseDto,
  PaginatedSalleActivityTagsDto,
  SalleActivityTagQueryDto,
  CreateExigenceEquipementDto,
  UpdateExigenceEquipementDto,
  ExigenceEquipementResponseDto,
  PaginatedExigencesEquipementDto,
  ExigenceEquipementQueryDto,
  ExigenceEquipementIdQueryDto,
} from './dto/compat.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Compatibilites')
@Controller('compat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompatController {
  constructor(private compatService: CompatService) {}

  // ============================================
  // Salle / Activity Tag
  // ============================================

  @Get('salle-activity-tags')
  @Permissions('salle:read')
  @ApiOperation({ summary: 'Lister les compatibilités salle / Activity Tag' })
  @ApiResponse({ status: 200, description: 'Liste paginée des compatibilités salle/tag', type: PaginatedSalleActivityTagsDto })
  async findAllSalleActivityTags(@Query() query: SalleActivityTagQueryDto): Promise<PaginatedSalleActivityTagsDto> {
    return this.compatService.findAllSalleActivityTags(query);
  }

  @Post('salle-activity-tags')
  @Permissions('salle:write')
  @ApiOperation({ summary: 'Autoriser un Activity Tag sur une salle' })
  @ApiResponse({ status: 201, description: 'Compatibilité salle/tag créée', type: SalleActivityTagResponseDto })
  @ApiResponse({ status: 404, description: 'Salle ou Activity Tag introuvable' })
  @ApiResponse({ status: 409, description: 'Tag déjà autorisé pour cette salle' })
  async createSalleActivityTag(@Body() dto: CreateSalleActivityTagDto): Promise<SalleActivityTagResponseDto> {
    return this.compatService.createSalleActivityTag(dto, 'system');
  }

  @Delete('salle-activity-tags/:salleId/tags/:activityTagId')
  @Permissions('salle:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un Activity Tag d\'une salle' })
  @ApiParam({ name: 'salleId', description: 'ID de la salle (UUID)' })
  @ApiParam({ name: 'activityTagId', description: 'ID de l\'Activity Tag (UUID)' })
  @ApiResponse({ status: 204, description: 'Compatibilité retirée' })
  @ApiResponse({ status: 404, description: 'Compatibilité non trouvée' })
  async removeSalleActivityTag(
    @Param('salleId') salleId: string,
    @Param('activityTagId') activityTagId: string,
  ): Promise<void> {
    return this.compatService.removeSalleActivityTag(salleId, activityTagId, 'system');
  }

  // ============================================
  // Exigences d'équipement
  // ============================================

  @Get('exigences-equipements')
  @Permissions('salle:read')
  @ApiOperation({ summary: 'Lister les exigences d\'équipement par (module, type d\'enseignement)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des exigences d\'équipement', type: PaginatedExigencesEquipementDto })
  async findAllExigencesEquipement(@Query() query: ExigenceEquipementQueryDto): Promise<PaginatedExigencesEquipementDto> {
    return this.compatService.findAllExigencesEquipement(query);
  }

  @Post('exigences-equipements')
  @Permissions('salle:write', 'exigence-salle:write')
  @ApiOperation({ summary: 'Créer une exigence d\'équipement' })
  @ApiResponse({ status: 201, description: 'Exigence d\'équipement créée', type: ExigenceEquipementResponseDto })
  @ApiResponse({ status: 404, description: 'Module, type d\'enseignement ou équipement introuvable' })
  @ApiResponse({ status: 409, description: 'Exigence d\'équipement déjà existante' })
  async createExigenceEquipement(@Body() dto: CreateExigenceEquipementDto): Promise<ExigenceEquipementResponseDto> {
    return this.compatService.createExigenceEquipement(dto, 'system');
  }

  @Patch('exigences-equipements')
  @Permissions('salle:write', 'exigence-salle:write')
  @ApiOperation({ summary: 'Mettre à jour le niveau d\'une exigence d\'équipement' })
  @ApiResponse({ status: 200, description: 'Exigence d\'équipement mise à jour', type: ExigenceEquipementResponseDto })
  @ApiResponse({ status: 404, description: 'Exigence d\'équipement non trouvée' })
  async updateExigenceEquipement(
    @Query() query: ExigenceEquipementIdQueryDto,
    @Body() dto: UpdateExigenceEquipementDto,
  ): Promise<ExigenceEquipementResponseDto> {
    return this.compatService.updateExigenceEquipement(
      query.moduleId,
      query.typeEnseignementId,
      query.equipementId,
      dto,
      'system',
    );
  }

  @Delete('exigences-equipements')
  @Permissions('salle:write', 'exigence-salle:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une exigence d\'équipement' })
  @ApiResponse({ status: 204, description: 'Exigence d\'équipement supprimée' })
  @ApiResponse({ status: 404, description: 'Exigence d\'équipement non trouvée' })
  async removeExigenceEquipement(@Query() query: ExigenceEquipementIdQueryDto): Promise<void> {
    return this.compatService.removeExigenceEquipement(query.moduleId, query.typeEnseignementId, query.equipementId, 'system');
  }
}
