// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur du rapport de traduction FET (L4-06)
import {
  Controller,
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
  ApiParam,
} from '@nestjs/swagger';
import { ContrainteFetMappingService } from './contrainte-fet-mapping.service.js';
import { FetMappingReportDto } from './dto/contrainte-fet-mapping.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Rapport de traduction FET')
@Controller('semestres/:semestreId/contraintes/fet-mapping')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContrainteFetMappingController {
  constructor(
    private readonly service: ContrainteFetMappingService,
  ) {}

  @Get()
  @Permissions('contrainte:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rapport de traduction FET d\'un semestre (prévisualisation)',
    description:
      'Retourne le statut de traduction (TRADUITE / PARTIELLE / NON_TRADUITE) de chaque contrainte active du semestre, avec la raison explicite pour les PARTIELLE. Distingue les règles traduites dans le fichier FET et celles contrôlées par l\'application.',
  })
  @ApiParam({ name: 'semestreId', description: 'ID du semestre (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Rapport de traduction',
    type: FetMappingReportDto,
  })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async genererRapport(
    @Param('semestreId') semestreId: string,
  ): Promise<FetMappingReportDto> {
    return this.service.genererRapportFetMapping(semestreId);
  }
}