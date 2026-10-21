// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur API des charges et agrégations (L2-10)

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChargesService } from './charges.service.js';
import { ChargeQueryDto, PaginatedChargesDto, ChargeEnseignantDto } from './dto/charge.dto.js';
import { AnnualChargesDto } from './dto/annual-charge.dto.js';
import { ChargeGlobaleDto } from './dto/charge.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Charges')
@Controller('charges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  @Get()
  @Permissions('charges:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister les charges et agrégations par dimension' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiQuery({ name: 'enseignantId', required: false, type: String, description: 'Filtrer par enseignant' })
  @ApiQuery({ name: 'departementId', required: false, type: String, description: 'Filtrer par département' })
  @ApiQuery({ name: 'formationId', required: false, type: String, description: 'Filtrer par formation' })
  @ApiQuery({ name: 'moduleId', required: false, type: String, description: 'Filtrer par module' })
  @ApiQuery({ name: 'groupeId', required: false, type: String, description: 'Filtrer par groupe' })
  @ApiQuery({ name: 'typeEnseignementId', required: false, type: String, description: 'Filtrer par type d’enseignement' })
  @ApiQuery({ name: 'dimension', required: false, enum: ['departement', 'formation', 'module', 'groupe', 'type'], description: 'Dimension d’agrégation' })
  @ApiResponse({ status: 200, description: 'Charges agrégées paginées', type: PaginatedChargesDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Aucune année active ou aucun jeu de règles publié' })
  async findAllCharges(
    @Query() query: ChargeQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedChargesDto> {
    return this.chargesService.findAllCharges(query, currentUser);
  }

  @Get('enseignant/:id')
  @Permissions('charges:read')
  @ApiParam({ name: 'id', description: 'ID de l’enseignant (UUID)' })
  @ApiOperation({ summary: 'Charge détaillée d’un enseignant' })
  @ApiResponse({ status: 200, description: 'Charge de l’enseignant', type: ChargeEnseignantDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Enseignant non trouvé' })
  async findChargeByEnseignant(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ChargeEnseignantDto> {
    return this.chargesService.findChargeByEnseignant(id, currentUser);
  }

  @Get('annuelles')
  @Permissions('charges:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Charges annuelles par enseignant (S1 + S2)' })
  @ApiQuery({ name: 'departementId', required: false, type: String, description: 'Filtrer par département (UUID)' })
  @ApiResponse({ status: 200, description: 'Charges annuelles par enseignant', type: AnnualChargesDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Aucune année active ou aucun jeu de règles publié' })
  async getAnnualCharges(
    @Query('departementId') departementId: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<AnnualChargesDto> {
    return this.chargesService.getAnnualCharges(departementId, currentUser);
  }

  @Get('enseignants/:id/charge-globale')
  @Permissions('charges:read')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'ID de l’enseignant (UUID)' })
  @ApiOperation({ summary: 'Charge globale d’un enseignant (multi-départements)' })
  @ApiResponse({ status: 200, description: 'Charge globale de l’enseignant', type: ChargeGlobaleDto })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou hors portée' })
  @ApiResponse({ status: 404, description: 'Enseignant non trouvé' })
  async getChargeGlobale(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<ChargeGlobaleDto> {
    return this.chargesService.getChargeGlobale(id, currentUser);
  }
}