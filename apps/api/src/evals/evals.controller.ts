// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur d'évaluation de contraintes souples (L3-27).
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
import { EvalsService } from './evals.service.js';
import { EvalQueryDto, EvalScoreDto, EvalDeltaDto } from './dto/eval-score.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('evals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('versions/:id/evals')
export class EvalsController {
  constructor(private readonly evalsService: EvalsService) {}

  @Get('score')
  @ApiOperation({ summary: 'Score de contraintes souples pour un placement candidat' })
  @ApiParam({ name: 'id', description: 'ID de la version' })
  @ApiQuery({ name: 'seanceId', required: true, description: 'ID de la séance' })
  @ApiQuery({ name: 'jour', required: false, description: 'Jour du placement candidat' })
  @ApiQuery({ name: 'creneauDebut', required: false, description: 'Créneau de début' })
  @ApiQuery({ name: 'salle', required: false, description: 'Salle cible' })
  @ApiQuery({ name: 'plagesAEviter', required: false, type: [String], description: 'Plages à éviter (slotKeys)' })
  @ApiQuery({ name: 'heuresConsecutivesMin', required: false, description: 'Heures consécutives minimum' })
  @ApiQuery({ name: 'heuresConsecutivesMax', required: false, description: 'Heures consécutives maximum' })
  @ApiResponse({ status: 200, type: EvalScoreDto })
  async score(
    @Param('id') versionId: string,
    @Query() q: EvalQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EvalScoreDto> {
    return this.evalsService.score(versionId, q.seanceId ?? '', q, currentUser);
  }

  @Get('delta')
  @ApiOperation({ summary: 'Delta de score entre ancien et nouveau placement' })
  @ApiParam({ name: 'id', description: 'ID de la version' })
  @ApiQuery({ name: 'seanceId', required: true, description: 'ID de la séance' })
  @ApiQuery({ name: 'jour', required: false, description: 'Jour du placement candidat' })
  @ApiQuery({ name: 'creneauDebut', required: false, description: 'Créneau de début' })
  @ApiQuery({ name: 'salle', required: false, description: 'Salle cible' })
  @ApiResponse({ status: 200, type: EvalDeltaDto })
  async delta(
    @Param('id') versionId: string,
    @Query() q: EvalQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<EvalDeltaDto> {
    return this.evalsService.delta(versionId, q.seanceId ?? '', q, currentUser);
  }
}