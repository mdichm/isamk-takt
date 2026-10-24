// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de comparaison de générations (L4-18)
// GET /generations/compare

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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { GenerationsService } from './generations.service.js';
import { CompareQueryDto } from './dto/compare-query.dto.js';
import { CompareResponseDto } from './dto/compare-response.dto.js';

// ============================================================================
// Comparaison de générations (L4-18)
// ============================================================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('generations')
@Controller('generations')
export class GenerationsController {
  constructor(private readonly service: GenerationsService) {}

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
}
