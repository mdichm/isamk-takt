// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur du tableau de préparation du semestre (L4-12)
// GET /semestres/{id}/preparation

import {
  Controller,
  Get,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { PreparationService } from './preparation.service.js';
import { PreparationResponseDto } from './dto/preparation.dto.js';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('preparation')
@Controller('semestres')
export class PreparationController {
  constructor(private readonly service: PreparationService) {}

  @Get(':id/preparation')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:launch')
  @ApiOperation({
    summary: 'Tableau de préparation du semestre avant génération',
    description: 'Retourne l’état de chacun des 10 contrôles de préparation (ST §4.12) et indique si la génération peut être lancée.',
  })
  @ApiParam({ name: 'id', description: 'ID du semestre (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'État de préparation du semestre',
    type: PreparationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  async getPreparation(
    @Param('id') id: string,
  ): Promise<PreparationResponseDto> {
    return this.service.getPreparation(id);
  }
}
