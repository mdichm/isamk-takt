// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur d'acceptation des avertissements (L3-39)
// POST /versions/{id}/avertissements:accept

import {
  Controller,
  Post,
  Param,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { AvertissementService } from './avertissement.service.js';
import { AcceptAvertissementDto } from './dto/accept-avertissement.dto.js';
import { AvertissementAccepteResponseDto } from './dto/avertissement-accepte-response.dto.js';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('avertissements')
@Controller('versions/:versionId/avertissements')
export class AvertissementController {
  constructor(private readonly service: AvertissementService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @Permissions('avertissement:accept')
  @ApiOperation({
    summary: 'Accepter un avertissement (EX-CTR-07, ST §4.15)',
    description:
      "Accepte un avertissement par signature de conflit. Retourne 422 BLOCKING_NOT_ACCEPTABLE si le conflit est bloquant.",
  })
  @ApiResponse({
    status: 200,
    description: 'Avertissement accepté',
    type: AvertissementAccepteResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version ou conflit introuvable' })
  @ApiResponse({
    status: 422,
    description: "Conflit bloquant non acceptables (BLOCKING_NOT_ACCEPTABLE)",
  })
  @ApiParam({ name: 'versionId', type: String })
  @ApiBody({ type: AcceptAvertissementDto })
  async accept(
    @Param('versionId') versionId: string,
    @Body() dto: AcceptAvertissementDto,
    @CurrentUser()
    currentUser: { id: string; role: string },
  ): Promise<AvertissementAccepteResponseDto> {
    return this.service.accept(
      versionId,
      dto.signature,
      dto.justification,
      currentUser,
    );
  }
}
