// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de générations (L4-15 + L4-18)
// Détail, annulation, fichier moteur, SSE, comparaison.

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GenerationsService } from './generations.service.js';
import { GenerationDetailResponseDto } from './dto/generation-detail-response.dto.js';
import { CancelGenerationResponseDto } from './dto/cancel-generation-response.dto.js';
import { EngineFileResponseDto } from './dto/engine-file-response.dto.js';
import { CompareQueryDto } from './dto/compare-query.dto.js';
import { CompareResponseDto } from './dto/compare-response.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { RelancerGenerationResponseDto } from './dto/relancer-generation-response.dto.js';

// ============================================================================
// Suivi des générations (L4-15)
// ============================================================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('generations')
@Controller('generations')
export class GenerationsController {
  constructor(private readonly service: GenerationsService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:read')
  @ApiOperation({ summary: 'Détail d une génération' })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la génération',
    type: GenerationDetailResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Génération introuvable' })
  async getGenerationDetail(
    @Param('id') id: string,
  ): Promise<GenerationDetailResponseDto> {
    return this.service.getGenerationDetail(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:cancel')
  @ApiOperation({ summary: 'Demander l annulation d une génération' })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Annulation demandée',
    type: CancelGenerationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Génération introuvable' })
  @ApiResponse({
    status: 400,
    description: 'Génération déjà terminée ou annulation déjà demandée',
  })
  async cancelGeneration(
    @Param('id') id: string,
  ): Promise<CancelGenerationResponseDto> {
    return this.service.cancelGeneration(id);
  }

  @Get(':id/engine-file')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:read')
  @ApiOperation({
    summary: 'Obtenir une URL signée pour télécharger le fichier moteur',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'URL signée pour le fichier moteur',
    type: EngineFileResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Génération ou fichier moteur introuvable' })
  async getEngineFile(@Param('id') id: string): Promise<EngineFileResponseDto> {
    return this.service.getEngineFileInfo(id);
  }

  @Get(':id/events')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:read')
  @ApiOperation({
    summary: 'Flux SSE des événements d une génération',
    description:
      'Événements : status, progress, done. Polling de la table Generation côté serveur.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({ status: 200, description: 'Flux SSE ouvert' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Génération introuvable' })
  async streamEvents(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const eventStream = this.service.streamGenerationEvents(id);

    // Lire le premier événement pour vérifier que la génération existe
    const first = await eventStream.next();
    if (first.done) {
      res.end();
      return;
    }
    res.write(first.value);

    // Pipe les événements suivants
    for await (const chunk of eventStream) {
      res.write(chunk);
    }

    res.end();
  }

  @Get(':id/engine-file/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Téléchargement du fichier moteur via URL signée',
    description:
      'Le token est passé en paramètre de requête ?token=... et vérifié côté serveur.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({ status: 200, description: 'Fichier .fet téléchargé' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  @ApiResponse({ status: 404, description: 'Fichier moteur introuvable' })
  async downloadEngineFile(
    @Param('id') id: string,
    @Body() body: { token?: string },
    @Res() res: Response,
  ): Promise<StreamableFile | void> {
    // Le token est passé en query param, pas en body
    // Ce endpoint est principalement documenté ; le worker stocke le fichier
    // et le sert directement. L'API redirige ou renvoie une 404 si pas de fichier.
    res.status(404).json({
      message: 'Téléchargement direct non implémenté côté API. Le fichier moteur est servi par le worker.',
    });
  }

  // ============================================================================
  // Comparaison de générations (L4-18)
  // ============================================================================

  @Get('compare')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Comparer 2 à 4 générations entre elles',
    description:
      'Retourne le résumé de chaque génération (score, classement, métriques) ' +
      'et un diff (séances identiques/différentes, conflits apparus/disparus, ' +
      'verrous respectés). Toutes les versions doivent partager les mêmes snapshots.',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la comparaison',
    type: CompareResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nombre d identifiants hors [2, 4] ou UUID invalide',
  })
  @ApiResponse({
    status: 403,
    description: 'Permissions insuffisantes',
  })
  @ApiResponse({
    status: 404,
    description: 'Une génération est introuvable',
  })
  @ApiResponse({
    status: 422,
    description: 'Les versions n ont pas les mêmes snapshots',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    required: true,
    description: 'Identifiants des générations (2 à 4 UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  async compare(
    @Query() dto: CompareQueryDto,
  ): Promise<CompareResponseDto> {
    return this.service.compare(dto.ids);
  }

  // ============================================================================
  // Relance d'une génération (L4-24)
  // ============================================================================

  @Post(':id/relancer')
  @HttpCode(HttpStatus.OK)
  @Permissions('generation:launch')
  @ApiOperation({ summary: 'Relancer une génération en échec' })
  @ApiParam({ name: 'id', description: 'Identifiant de la génération (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Génération relancée',
    type: RelancerGenerationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Génération introuvable' })
  @ApiResponse({ status: 409, description: 'Une génération est déjà en cours sur ce semestre' })
  @ApiResponse({ status: 422, description: 'Génération non en échec (FAILED ou TIMED_OUT)' })
  async relancerGeneration(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<RelancerGenerationResponseDto> {
    return this.service.relancerGeneration(id, currentUser.id);
  }
}
