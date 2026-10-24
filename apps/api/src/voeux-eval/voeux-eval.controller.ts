// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Controleur de l'evaluateur de satisfaction des voeux (L3-35).
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VoeuxEvalService } from './voeux-eval.service.js';
import { VoeuEvalScoreDto, VoeuEvalDeltaDto, VoeuEvalQueryDto } from './dto/voeux-eval.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('voeux-eval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('versions/:id/voeux-eval')
export class VoeuxEvalController {
  constructor(private readonly evalService: VoeuxEvalService) {}

  @Get('score')
  @ApiOperation({ summary: 'Score de satisfaction des vœux pour un enseignant sur un placement' })
  @ApiParam({ name: 'id', description: 'ID de la version' })
  @ApiQuery({ name: 'enseignantId', required: true, description: 'ID de l\'enseignant cible' })
  @ApiQuery({ name: 'jour', required: false, description: 'Jour du placement candidat' })
  @ApiQuery({ name: 'creneauDebut', required: false, description: 'Creneau de debut' })
  @ApiQuery({ name: 'salle', required: false, description: 'Salle cible' })
  @ApiQuery({ name: 'plagesAEviter', required: false, type: [String], description: 'Plages a eviter (slotKeys)' })
  @ApiQuery({ name: 'heuresConsecutivesMin', required: false, description: 'Heures consecutives minimum' })
  @ApiQuery({ name: 'heuresConsecutivesMax', required: false, description: 'Heures consecutives maximum' })
  @ApiResponse({ status: 200, type: VoeuEvalScoreDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version ou enseignant introuvable' })
  async score(
    @Param('id') versionId: string,
    @Query() q: VoeuEvalQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VoeuEvalScoreDto> {
    if (!q.enseignantId) {
      throw new Error('enseignantId requis');
    }
    return this.evalService.score(versionId, q.enseignantId, q);
  }

  @Get('delta')
  @ApiOperation({ summary: 'Delta de satisfaction des vœux avant/apres deplacement' })
  @ApiParam({ name: 'id', description: 'ID de la version' })
  @ApiQuery({ name: 'enseignantId', required: true, description: 'ID de l\'enseignant cible' })
  @ApiQuery({ name: 'jour', required: false, description: 'Jour du placement candidat' })
  @ApiQuery({ name: 'creneauDebut', required: false, description: 'Creneau de debut' })
  @ApiQuery({ name: 'salle', required: false, description: 'Salle cible' })
  @ApiQuery({ name: 'plagesAEviter', required: false, type: [String], description: 'Plages a eviter (slotKeys)' })
  @ApiQuery({ name: 'heuresConsecutivesMin', required: false, description: 'Heures consecutives minimum' })
  @ApiQuery({ name: 'heuresConsecutivesMax', required: false, description: 'Heures consecutives maximum' })
  @ApiResponse({ status: 200, type: VoeuEvalDeltaDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version ou enseignant introuvable' })
  async delta(
    @Param('id') versionId: string,
    @Query() q: VoeuEvalQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<VoeuEvalDeltaDto> {
    if (!q.enseignantId) {
      throw new Error('enseignantId requis');
    }
    return this.evalService.delta(versionId, q.enseignantId, q);
  }
}
