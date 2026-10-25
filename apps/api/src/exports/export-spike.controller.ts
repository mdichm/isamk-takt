// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur du spike d'export PDF/Excel (L6-01, S2)
// POST /exports/spike — déclenche un rendu de test et retourne les métriques.
import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@takt/db';
import { ExportSpikeService } from './export-spike.service.js';
import { ExportSpikeDto } from './dto/export-spike.dto.js';
import { ExportSpikeResponseDto, RenderResultDto } from './dto/export-spike.dto.js';

@ApiTags('Export spike (S2)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exports/spike')
export class ExportSpikeController {
  constructor(private readonly spike: ExportSpikeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Spike de rendu PDF/Excel (S2)',
    description:
      'Déclenche un rendu de test pour comparer les bibliothèques d’export, ' +
      'mesurer le temps de rendu et vérifier la lisibilité en noir et blanc.',
  })
  @ApiResponse({
    status: 201,
    description: 'Résultat du spike avec métriques de rendu et recommandation',
    type: ExportSpikeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès réservé à l’Administrateur et au Gestionnaire',
  })
  async render(@Body() dto: ExportSpikeDto): Promise<ExportSpikeResponseDto> {
    const result = await this.spike.render(dto);

    let recommendedLibrary: string;
    let justification: string;

    if (result.format === 'pdf') {
      recommendedLibrary = 'Playwright/Chromium (HTML → PDF)';
      justification =
        'Permet un rendu fidèle A4/A3 avec logos, en-têtes, pieds de page, ' +
        'polices françaises auto-hébergées et vérification N&B. Adapté aux exports officiels.';
    } else {
      recommendedLibrary = 'xlsx (ExcelJS-compatible)';
      justification =
        'Génération XLSX directe sans navigateur, très rapide et adaptée ' +
        'aux grilles de charges et tableaux de données.';
    }

    return {
      result,
      recommendedLibrary,
      justification,
    };
  }
}
