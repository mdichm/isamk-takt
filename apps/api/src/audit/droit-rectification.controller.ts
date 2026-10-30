// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de droit de rectification des données personnelles (L7-12, EX-NFR-06)
// PATCH /utilisateurs/mes-donnees

import {
  Controller,
  Patch,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { DroitRectificationService } from './droit-rectification.service.js';
import type { RectificationDto } from './dto/droit-personnel.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

interface AuthenticatedUser {
  id: string;
  role: string;
}

@ApiTags('Données personnelles (INPDP)')
@Controller('utilisateurs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DroitRectificationController {
  constructor(private readonly droitRectification: DroitRectificationService) {}

  @Patch('mes-donnees')
  @ApiOperation({
    summary: 'Rectifier mes données personnelles (droit de rectification)',
    description:
      'Permet à l\'utilisateur connecté de corriger son nom, prénom et e-mail. Conformément au droit de rectification (INPDP / RGPD art. 16).',
  })
  @ApiResponse({
    status: 200,
    description: 'Données rectifiées avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 409, description: 'E-mail déjà utilisé' })
  async rectifierMesDonnees(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: RectificationDto,
  ): Promise<void> {
    await this.droitRectification.rectifierMesDonnees(
      user.id,
      data,
      undefined, // requestId sera rempli par le middleware si disponible
    );
  }
}