// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de paramétrage des circuits de workflow (L5-17)
// GET et PATCH /parametres/workflow

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParametresService } from './parametres.service.js';
import { WorkflowParamsResponseDto } from './dto/workflow-params-response.dto.js';
import { WorkflowParamsUpdateDto } from './dto/workflow-params-update.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Paramètres du workflow')
@Controller('parametres')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParametresController {
  constructor(private readonly parametresService: ParametresService) {}

  /**
   * Lit les paramètres globaux du workflow.
   * Accessible à tous les rôles (parametre:read).
   */
  @Get('workflow')
  @Permissions('parametre:read')
  @ApiOperation({ summary: 'Obtenir les paramètres globaux du workflow' })
  @ApiResponse({
    status: 200,
    description: 'Paramètres du workflow retournés',
    type: WorkflowParamsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Aucun paramètre trouvé' })
  async getWorkflowParams(): Promise<WorkflowParamsResponseDto> {
    return this.parametresService.getParams();
  }

  /**
   * Met à jour les paramètres globaux du workflow.
   * Réservé à l'Administrateur (parametre:write).
   * Écrit une entrée d'audit (ancienne et nouvelle valeur, motif facultatif).
   */
  @Patch('workflow')
  @Permissions('parametre:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour les paramètres globaux du workflow',
    description:
      'Modifie validationPlanningRequise et/ou publicationRequise. Au moins un des deux doit être présent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres mis à jour',
    type: WorkflowParamsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Corps invalide (aucun champ à mettre à jour)' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Aucun paramètre trouvé' })
  async updateWorkflowParams(
    @Body() dto: WorkflowParamsUpdateDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ): Promise<WorkflowParamsResponseDto> {
    return this.parametresService.updateParams(dto, currentUser.id);
  }
}
