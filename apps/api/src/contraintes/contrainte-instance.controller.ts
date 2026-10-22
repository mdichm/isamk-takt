import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ContrainteInstanceService } from './contrainte-instance.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  ContrainteInstanceCreateDto,
  ContrainteInstanceUpdateDto,
  ContrainteInstanceResponseDto,
  PaginatedContrainteInstancesDto,
  ContrainteInstanceListQueryDto,
  ContrainteResolusQueryDto,
  ContrainteResolutionResponseDto,
  ContrainteCoherenceQueryDto,
  CoherenceReportDto,
} from './dto/contrainte-instance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Instances de contraintes')
@Controller('contraintes/instances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContrainteInstanceController {
  constructor(private readonly service: ContrainteInstanceService) {}

  @Post()
  @Permissions('contrainte:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une instance de contrainte pour un semestre' })
  @ApiResponse({ status: 201, description: 'Instance créée', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalibles (cible/poids incohérents)' })
  @ApiResponse({ status: 404, description: 'Semestre ou définition introuvable' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  async create(
    @Body() dto: ContrainteInstanceCreateDto,
  ): Promise<ContrainteInstanceResponseDto> {
    return this.service.createContrainteInstance(dto, 'system');
  }

  @Get()
  @Permissions('contrainte:read')
  @ApiOperation({ summary: 'Lister les instances de contraintes avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des instances', type: PaginatedContrainteInstancesDto })
  async findAll(
    @Query() query: ContrainteInstanceListQueryDto,
  ): Promise<PaginatedContrainteInstancesDto> {
    return this.service.findAll(query);
  }

  @Get('resolus')
  @Permissions('contrainte:read')
  @ApiOperation({
    summary: 'Résoudre les contraintes applicables à un sujet (précédence)',
    description:
      "Retourne les contraintes résolues pour un sujet donné : une instance dure spécifique remplace la globale de même code ; les instances souples de même code s'accumulent.",
  })
  @ApiQuery({ name: 'semestreId', description: 'ID du semestre', required: true })
  @ApiQuery({
    name: 'sujetType',
    enum: ['GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE'],
    description: "Type de sujet (portée de la contrainte)",
    required: true,
  })
  @ApiQuery({
    name: 'sujetId',
    description: 'ID du sujet (requis sauf si sujetType = GLOBALE)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Contraintes résolues',
    type: ContrainteResolutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  async resolus(
    @Query() query: ContrainteResolusQueryDto,
  ): Promise<ContrainteResolutionResponseDto> {
    return this.service.resolveContraintesPourSujet(
      query.semestreId,
      query.sujetType,
      query.sujetId,
    );
  }

  @Get('coherence')
  @Permissions('contrainte:read')
  @ApiOperation({
    summary: 'Contrôler la cohérence des contraintes d’un semestre',
    description:
      'Détecte les incohérences (min > max, doublons) et les avertissements (volume groupe > plafond).',
  })
  @ApiQuery({ name: 'semestreId', description: 'ID du semestre', required: true })
  @ApiResponse({
    status: 200,
    description: 'Rapport de cohérence',
    type: CoherenceReportDto,
  })
  @ApiResponse({ status: 404, description: 'Semestre introuvable' })
  async coherence(
    @Query() query: ContrainteCoherenceQueryDto,
  ): Promise<CoherenceReportDto> {
    return this.service.verifierCoherenceSemestre(query.semestreId);
  }

  @Get(':id')
  @Permissions('contrainte:read')
  @ApiOperation({ summary: 'Obtenir une instance de contrainte par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 200, description: 'Instance trouvée', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  async findOne(@Param('id') id: string): Promise<ContrainteInstanceResponseDto> {
    return this.service.findOneById(id);
  }

  @Patch(':id')
  @Permissions('contrainte:write')
  @ApiOperation({ summary: 'Mettre à jour une instance de contrainte' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 200, description: 'Instance mise à jour', type: ContrainteInstanceResponseDto })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async update(
    @Param('id') id: string,
    @Body() dto: ContrainteInstanceUpdateDto,
  ): Promise<ContrainteInstanceResponseDto> {
    return this.service.updateContrainteInstance(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('contrainte:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une instance de contrainte (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'instance de contrainte (UUID)' })
  @ApiResponse({ status: 204, description: 'Instance désactivée' })
  @ApiResponse({ status: 404, description: 'Instance non trouvée' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.removeContrainteInstance(id);
  }
}