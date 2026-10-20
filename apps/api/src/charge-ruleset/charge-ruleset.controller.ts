// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur Jeux de règles de charge (L2-03)

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChargeRuleSetService } from './charge-ruleset.service.js';
import {
  CreateChargeRuleSetDto,
  UpdateChargeRuleSetDto,
  ChargeRuleSetResponseDto,
} from './dto/charge-ruleset.response.dto.js';
import {
  CreateChargeReferenceGradeDto,
  ChargeReferenceGradeResponseDto,
} from './dto/charge-reference-grade.dto.js';
import {
  CreateChargeCoefficientDto,
  ChargeCoefficientResponseDto,
} from './dto/charge-coefficient.dto.js';

@ApiTags('charge-rulesets')
@Controller('charge/rulesets')
export class ChargeRuleSetController {
  constructor(private readonly service: ChargeRuleSetService) {}

  @Get()
  @Permissions('charge-ruleset:read')
  @ApiOperation({ summary: 'Lister les jeux de règles de charge' })
  async findAll(): Promise<ChargeRuleSetResponseDto[]> {
    return this.service.findAllChargeRuleSets();
  }

  @Get(':id')
  @Permissions('charge-ruleset:read')
  @ApiOperation({ summary: 'Récupérer un jeu de règles de charge' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async findOne(@Param('id') id: string): Promise<ChargeRuleSetResponseDto> {
    return this.service.findChargeRuleSetById(id);
  }

  @Post()
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un jeu de règles de charge (brouillon)' })
  async create(
    @Body() dto: CreateChargeRuleSetDto,
  ): Promise<ChargeRuleSetResponseDto> {
    return this.service.createChargeRuleSet(dto);
  }

  @Patch(':id')
  @Permissions('charge-ruleset:write')
  @ApiOperation({ summary: 'Mettre à jour un jeu de règles de charge (interdit si publié)' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChargeRuleSetDto,
  ): Promise<ChargeRuleSetResponseDto> {
    return this.service.updateChargeRuleSet(id, dto);
  }

  @Delete(':id')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un jeu de règles de charge (interdit si publié)' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.removeChargeRuleSet(id);
  }

  @Post(':id/publish')
  @Permissions('charge-ruleset:write')
  @ApiOperation({ summary: 'Publier un jeu de règles de charge (rend immuable)' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async publish(
    @Param('id') id: string,
  ): Promise<ChargeRuleSetResponseDto> {
    return this.service.publishChargeRuleSet(id);
  }

  @Post(':id/new-version')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle version (numero +1) à partir dun jeu publié',
  })
  @ApiParam({ name: 'id', description: 'ID du jeu publié (UUID)' })
  async newVersion(
    @Param('id') id: string,
  ): Promise<ChargeRuleSetResponseDto> {
    return this.service.newChargeRuleSetVersion(id);
  }
  @Post(':id/reference-grades')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un coefficient par grade à un jeu de règles' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async createReferenceGrade(
    @Param('id') rulesetId: string,
    @Body() dto: CreateChargeReferenceGradeDto,
  ): Promise<ChargeReferenceGradeResponseDto> {
    return this.service.createChargeReferenceGrade(rulesetId, dto);
  }

  @Patch(':id/reference-grades')
  @Permissions('charge-ruleset:write')
  @ApiOperation({ summary: 'Mettre à jour un coefficient par grade' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  @ApiQuery({
    name: 'gradeId',
    required: false,
    description: 'ID du grade (omettre pour le coefficient par défaut)',
  })
  async updateReferenceGrade(
    @Param('id') rulesetId: string,
    @Query('gradeId') gradeId: string | null,
    @Body('coefficient') coefficient: number,
  ): Promise<ChargeReferenceGradeResponseDto> {
    const resolvedGradeId =
      gradeId === 'null' || gradeId === undefined ? null : gradeId;
    return this.service.updateChargeReferenceGrade(
      rulesetId,
      resolvedGradeId,
      coefficient,
    );
  }

  @Delete(':id/reference-grades')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un coefficient par grade' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  @ApiQuery({
    name: 'gradeId',
    required: false,
    description: 'ID du grade (omettre pour le coefficient par défaut)',
  })
  async removeReferenceGrade(
    @Param('id') rulesetId: string,
    @Query('gradeId') gradeId: string | null,
  ): Promise<void> {
    const resolvedGradeId =
      gradeId === 'null' || gradeId === undefined ? null : gradeId;
    return this.service.removeChargeReferenceGrade(rulesetId, resolvedGradeId);
  }

  @Post(':id/coefficients')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un coefficient par type d\'enseignement' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  async createCoefficient(
    @Param('id') rulesetId: string,
    @Body() dto: CreateChargeCoefficientDto,
  ): Promise<ChargeCoefficientResponseDto> {
    return this.service.createChargeCoefficient(rulesetId, dto);
  }

  @Patch(':id/coefficients/:typeId')
  @Permissions('charge-ruleset:write')
  @ApiOperation({ summary: 'Mettre à jour un coefficient par type d\'enseignement' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  @ApiParam({ name: 'typeId', description: 'ID du type d\'enseignement (UUID)' })
  async updateCoefficient(
    @Param('id') rulesetId: string,
    @Param('typeId') typeId: string,
    @Body('coefficient') coefficient: number,
  ): Promise<ChargeCoefficientResponseDto> {
    return this.service.updateChargeCoefficient(rulesetId, typeId, coefficient);
  }

  @Delete(':id/coefficients/:typeId')
  @Permissions('charge-ruleset:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un coefficient par type d\'enseignement' })
  @ApiParam({ name: 'id', description: 'ID du jeu de règles (UUID)' })
  @ApiParam({ name: 'typeId', description: 'ID du type d\'enseignement (UUID)' })
  async removeCoefficient(
    @Param('id') rulesetId: string,
    @Param('typeId') typeId: string,
  ): Promise<void> {
    return this.service.removeChargeCoefficient(rulesetId, typeId);
  }
}

