// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur des conflits (L3-17)
// POST /versions/{id}/conflits/recompute — recalcul complet des conflits
// GET    /versions/{id}/conflits           — liste des conflits non résolus

import {
  Controller,
  Post,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { ConflitService } from './conflit.service.js';
import { ConflitResponseDto } from './dto/conflit-response.dto.js';

// ============================================================================
// Conflit (L3-17)
// ============================================================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('conflits')
@Controller('versions/:versionId/conflits')
export class ConflitController {
  constructor(private readonly service: ConflitService) {}

  @Post('recompute')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:write')
  @ApiOperation({
    summary: 'Recalcul complet des conflits d’une version',
  })
  @ApiResponse({
    status: 200,
    description: 'Conflits recalculés et persistés',
    type: [ConflitResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async recompute(
    @Param('versionId') versionId: string,
  ): Promise<ConflitResponseDto[]> {
    return this.service.recomputeConflits(versionId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Lister les conflits non résolus d’une version',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des conflits non résolus',
    type: [ConflitResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  async list(
    @Param('versionId') versionId: string,
  ): Promise<ConflitResponseDto[]> {
    return this.service.getConflits(versionId);
  }
}
