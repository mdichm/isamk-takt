// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Contrôleur de consultation des séances (L3-11)
// GET /versions/{id}/seances, GET /seances/{id}
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Patch,
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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { IfMatch } from '../common/decorators/if-match.decorator.js';
import { SeancesService } from './seances.service.js';
import { SeanceQueryDto } from './dto/seance-query.dto.js';
import { SeanceResponseDto } from './dto/seance-response.dto.js';
import { PaginatedSeancesDto } from './dto/seance-query.dto.js';
import { SimulateSeanceService } from './simulate-seance.service.js';
import {
  SimulatePlacementDto,
  SimulatePlacementResponseDto,
} from './dto/simulate-placement.dto.js';
import { MoveSeanceService } from './move-seance.service.js';
import { MoveSeanceDto } from './dto/move-seance.dto.js';
import { ChangeEnseignantService } from './change-enseignant.service.js';
import { ChangeEnseignantDto } from './dto/change-enseignant.dto.js';
import { UndoSeanceService } from './undo-seance.service.js';
import { UndoSeanceDto } from './dto/undo-seance.dto.js';
import { SuggestionsService } from './suggestions.service.js';
import { SuggestionsQueryDto } from './dto/suggestions.dto.js';
import { SuggestionsResponseDto } from './dto/suggestions.dto.js';

// ============================================
// Seance (L3-11)
// GET /versions/{id}/seances — liste paginée des séances d'une version
// GET /seances/{id} — détail d'une séance avec ses occupations
// ============================================

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('seances')
@Controller('seances')
export class SeancesController {
  constructor(
    private readonly service: SeancesService,
    private readonly simulateService: SimulateSeanceService,
    private readonly moveService: MoveSeanceService,
    private readonly changeEnseignantService: ChangeEnseignantService,
    private readonly undoSeanceService: UndoSeanceService,
    private readonly suggestionsService: SuggestionsService,
  ) {}

  @Get('versions/:versionId/seances')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Lister les séances d\'une version (paginé, filtres)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des séances',
    type: PaginatedSeancesDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Version introuvable' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'statut', required: false, enum: ['NON_PLACEE', 'PLACEE'] })
  @ApiQuery({ name: 'jour', required: false, type: String })
  @ApiQuery({ name: 'groupeId', required: false, type: String })
  @ApiQuery({ name: 'enseignantId', required: false, type: String })
  @ApiQuery({ name: 'salleId', required: false, type: String })
  @ApiQuery({ name: 'affectationKey', required: false, type: String })
  async listByVersion(
    @Param('versionId') versionId: string,
    @Query() query: SeanceQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<PaginatedSeancesDto> {
    const result = await this.service.findSeancesByVersion(
      versionId,
      query,
      currentUser,
    );
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({ summary: 'Détail d\'une séance avec ses occupations' })
  @ApiResponse({
    status: 200,
    description: 'Détail de la séance',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.service.findSeanceById(id, currentUser);
  }

  @Post(':id/placement:simulate')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary:
      'Simulation de placement sans écriture en base (L3-21). Retourne les conflits respectés/violés et les impacts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Résultat de la simulation de placement',
    type: SimulatePlacementResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  async simulatePlacement(
    @Param('id') id: string,
    @Body() dto: SimulatePlacementDto,
    @CurrentUser()
    currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SimulatePlacementResponseDto> {
    return this.simulateService.simulate(id, dto, currentUser);
  }

  @Patch(':id/placement')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:write')
  @ApiOperation({
    summary: 'Déplacer une séance sur un nouveau créneau et/ou salle (L3-20)',
    description:
      'Contrôle optimiste via If-Match (412 si périmé), vérification du bail d\'édition, des verrous de séance et des conflits bloquants (422 SEANCE_CONFLICT_BLOCKING avec détail et rollback).',
  })
  @ApiParam({ name: 'id', type: String, description: 'Identifiant de la séance' })
  @ApiResponse({
    status: 200,
    description:
      'Séance déplacée, révision incrémentée. Inclut softScore (score contraintes souples 0-100) et softDelta (delta de score) si des contraintes souples sont actives pour le semestre.',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou bail détenu par un autre' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  @ApiResponse({ status: 409, description: 'Version immuable ou séance verrouillée' })
  @ApiResponse({
    status: 412,
    description: 'If-Match manquant ou révision périmée',
  })
  @ApiResponse({
    status: 422,
    description: 'Conflit bloquant (SEANCE_CONFLICT_BLOCKING)',
  })
  async move(
    @Param('id') id: string,
    @Body() dto: MoveSeanceDto,
    @IfMatch() ifMatch: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.moveService.move(id, dto, ifMatch, currentUser);
  }

  @Patch(':id/enseignant')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:write')
  @ApiOperation({
    summary: 'Changer l\'enseignant d\'une séance (L3-22)',
    description:
      'Contrôle optimiste via If-Match (412 si périmé), vérification du bail d\'édition, des verrous enseignant/activité et de l\'autorisation du nouvel enseignant dans le snapshot pour tous les groupes (422 TEACHER_NOT_ASSIGNED). Recompute des conflits après modification.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Identifiant de la séance' })
  @ApiResponse({
    status: 200,
    description: 'Enseignant changé avec révision incrémentée',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou bail détenu par un autre' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  @ApiResponse({ status: 409, description: 'Version immuable ou séance verrouillée (enseignant/activité)' })
  @ApiResponse({ status: 412, description: 'If-Match manquant ou révision périmée' })
  @ApiResponse({
    status: 422,
    description: 'Enseignant non autorisé pour tous les groupes (TEACHER_NOT_ASSIGNED)',
  })
  async changeEnseignant(
    @Param('id') id: string,
    @Body() dto: ChangeEnseignantDto,
    @IfMatch() ifMatch: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.changeEnseignantService.changeEnseignant(id, dto, ifMatch, currentUser);
  }

  @Patch(':id/undo')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:write')
  @ApiOperation({
    summary: 'Annuler le dernier déplacement d\'une séance (L3-24)',
    description:
      'Restaure la position précédente (avant le dernier déplacement) avec les mêmes contrôles que le déplacement : contrôle optimiste via If-Match (412 si périmé), bail d\'édition, verrous de séance et immuabilité des versions PUBLIE/ARCHIVE.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Identifiant de la séance' })
  @ApiResponse({
    status: 200,
    description: 'Séance restaurée à sa position précédente, révision incrémentée',
    type: SeanceResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes ou bail détenu par un autre' })
  @ApiResponse({ status: 404, description: 'Séance introuvable ou aucun historique de déplacement' })
  @ApiResponse({ status: 409, description: 'Version immuable ou séance verrouillée' })
  @ApiResponse({ status: 412, description: 'If-Match manquant ou révision périmée' })
  async undo(
    @Param('id') id: string,
    @Body() dto: UndoSeanceDto,
    @IfMatch() ifMatch: string,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SeanceResponseDto> {
    return this.undoSeanceService.undo(id, ifMatch, currentUser, dto);
  }

  @Get(':id/suggestions')
  @HttpCode(HttpStatus.OK)
  @Permissions('version:read')
  @ApiOperation({
    summary: 'Suggestions de résolution pour une séance (L3-25)',
    description:
      'Retourne jusqu’à 20 alternatives de placement sans conflit bloquant, triées par conflits résolus, delta de score souple, distance, salle conservée. Lecture seule, aucune écriture.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Identifiant de la séance' })
  @ApiQuery({ name: 'jour', required: false, enum: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] })
  @ApiQuery({ name: 'creneauDebutId', required: false, type: String })
  @ApiQuery({ name: 'salleId', required: false, type: String })
  @ApiQuery({ name: 'enseignantId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Liste des suggestions de placement',
    type: SuggestionsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Séance introuvable (ou hors portée)' })
  async suggestions(
    @Param('id') id: string,
    @Query() query: SuggestionsQueryDto,
    @CurrentUser() currentUser: { id: string; role: string; departments?: string[] },
  ): Promise<SuggestionsResponseDto> {
    return this.suggestionsService.suggestions(id, query, currentUser);
  }
}
