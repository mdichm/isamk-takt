// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur du tableau de bord (L5-26)
// GET /tableau-de-bord?semestreId=&actions=

import {
  Controller,
  Get,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TableauDeBordService } from './tableau-de-bord.service.js';
import { TableauDeBordQueryDto } from './dto/tableau-de-bord-query.dto.js';
import { TableauDeBordResponseDto } from './dto/tableau-de-bord-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('tableau-de-bord')
@Controller('tableau-de-bord')
export class TableauDeBordController {
  constructor(private readonly service: TableauDeBordService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('tableau-de-bord:read')
  @ApiOperation({
    summary: 'Tableau de bord agrégé par rôle (L5-26)',
    description:
      'Retourne les indicateurs des 4 voies (préparation, impact, charge, validation) ' +
      'et les actions prioritaires déterministes. Le contenu varie selon le rôle de l utilisateur.',
  })
  @ApiQuery({
    name: 'semestreId',
    required: false,
    type: String,
    description: 'Identifiant du semestre (UUID). Si omis, le semestre actif est utilisé.',
  })
  @ApiQuery({
    name: 'actions',
    required: false,
    type: String,
    description: 'Si "all", retourne la liste complète des actions prioritaires',
  })
  @ApiResponse({
    status: 200,
    description: 'Tableau de bord selon le rôle',
    type: TableauDeBordResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  async getTableauDeBord(
    @Query() query: TableauDeBordQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<TableauDeBordResponseDto> {
    return this.service.getTableauDeBord(
      query,
      currentUser,
      query.actions === 'all',
    );
  }
}
