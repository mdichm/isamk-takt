// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de droit d'accès aux données personnelles (L7-12, EX-NFR-06)
// GET /utilisateurs/mes-donnees

import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { DroitAccesService } from './droit-acces.service.js';
import { ExportMesDonneesDto } from './dto/droit-personnel.dto.js';
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
export class DroitAccesController {
  constructor(private readonly droitAcces: DroitAccesService) {}

  @Get('mes-donnees')
  @ApiOperation({
    summary: 'Exporter mes données personnelles (droit d\'accès)',
    description:
      'Retourne toutes les données personnelles de l\'utilisateur connecté : profil, événements de sécurité et jobs d\'export. Conformément au droit d\'accès (INPDP / RGPD art. 15).',
  })
  @ApiResponse({
    status: 200,
    description: 'Données personnelles de l\'utilisateur',
    type: ExportMesDonneesDto,
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMesDonnees(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExportMesDonneesDto> {
    return this.droitAcces.getMesDonnees(user.id);
  }
}