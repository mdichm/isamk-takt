// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de droit à l'oubli (suppression des données personnelles) (L7-12, EX-NFR-06)
// POST /utilisateurs/mes-donnees/suppression

import {
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { DroitSuppressionService } from './droit-suppression.service.js';
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
export class DroitSuppressionController {
  constructor(private readonly droitSuppression: DroitSuppressionService) {}

  @Post('mes-donnees/suppression')
  @ApiOperation({
    summary: 'Demander la suppression de mes données personnelles (droit à l\'oubli)',
    description:
      'Demande l\'anonymisation des données personnelles de l\'utilisateur connecté. Conformément au droit à l\'oubli (INPDP / RGPD art. 17).',
  })
  @ApiResponse({
    status: 200,
    description: 'Demande de suppression enregistrée',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async demanderSuppression(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.droitSuppression.demanderSuppression(user.id);
  }
}