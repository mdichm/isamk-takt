import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AnneesService } from './annees.service.js';
import {
  CreateAnneeDto,
  UpdateAnneeDto,
  AnneeResponseDto,
  PaginatedAnneesDto,
  AnneeQueryDto,
  CreateSemestreDto,
  UpdateSemestreDto,
  SemestreResponseDto,
  PaginatedSemestresDto,
  SemestreQueryDto,
  TransitionAnneeDto,
} from './dto/annee.dto.js';
import {
  GenerateCreneauxDto,
  GenerateCreneauxResponseDto,
} from './dto/generate-creneaux.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Années & semestres')
@Controller('annees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnneesController {
  constructor(private anneesService: AnneesService) {}

  // ============================================
  // Années
  // ============================================

  @Post()
  @Permissions('annee:write')
  @ApiOperation({ summary: 'Créer une année universitaire' })
  @ApiResponse({ status: 201, description: 'Année créée', type: AnneeResponseDto })
  @ApiResponse({ status: 409, description: 'Code ou numéro d\'année déjà existant' })
  async createAnnee(@Body() dto: CreateAnneeDto): Promise<AnneeResponseDto> {
    return this.anneesService.createAnnee(dto, 'system');
  }

  @Get()
  @Permissions('annee:read')
  @ApiOperation({ summary: 'Lister les années avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des années', type: PaginatedAnneesDto })
  async findAllAnnees(@Query() query: AnneeQueryDto): Promise<PaginatedAnneesDto> {
    return this.anneesService.findAllAnnees(query);
  }

  @Get(':id')
  @Permissions('annee:read')
  @ApiOperation({ summary: 'Obtenir une année par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'année (UUID)' })
  @ApiResponse({ status: 200, description: 'Année trouvée', type: AnneeResponseDto })
  @ApiResponse({ status: 404, description: 'Année non trouvée' })
  async findAnneeById(@Param('id') id: string): Promise<AnneeResponseDto> {
    return this.anneesService.findAnneeById(id);
  }

  @Patch(':id')
  @Permissions('annee:write')
  @ApiOperation({ summary: 'Mettre à jour une année' })
  @ApiParam({ name: 'id', description: 'ID de l\'année (UUID)' })
  @ApiResponse({ status: 200, description: 'Année mise à jour', type: AnneeResponseDto })
  @ApiResponse({ status: 404, description: 'Année non trouvée' })
  @ApiResponse({ status: 409, description: 'Code ou numéro déjà utilisé' })
  async updateAnnee(
    @Param('id') id: string,
    @Body() dto: UpdateAnneeDto,
  ): Promise<AnneeResponseDto> {
    return this.anneesService.updateAnnee(id, dto, 'system');
  }

  @Delete(':id')
  @Permissions('annee:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une année' })
  @ApiParam({ name: 'id', description: 'ID de l\'année (UUID)' })
  @ApiResponse({ status: 204, description: 'Année supprimée' })
  @ApiResponse({ status: 404, description: 'Année non trouvée' })
  @ApiResponse({ status: 409, description: 'L\'année contient des semestres' })
  async removeAnnee(@Param('id') id: string): Promise<void> {
    return this.anneesService.removeAnnee(id, 'system');
  }

  @Post(':id/transitions')
  @Permissions('annee:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer ou clôturer une année universitaire' })
  @ApiParam({ name: 'id', description: 'ID de l\'année (UUID)' })
  @ApiResponse({ status: 200, description: 'Année après transition', type: AnneeResponseDto })
  @ApiResponse({ status: 400, description: 'Confirmation requise pour la clôture' })
  @ApiResponse({ status: 404, description: 'Année non trouvée' })
  @ApiResponse({ status: 409, description: 'Conflit de statut (déjà active / déjà clôturée / impossible de clôturer une année en préparation)' })
  async transitionAnnee(
    @Param('id') id: string,
    @Body() dto: TransitionAnneeDto,
  ): Promise<AnneeResponseDto> {
    return this.anneesService.activerAnnee(id, dto, 'system');
  }

  // ============================================
  // Semestres
  // ============================================

  @Post(':anneeId/semestres')
  @Permissions('annee:write')
  @ApiOperation({ summary: 'Créer un semestre pour une année' })
  @ApiParam({ name: 'anneeId', description: 'ID de l\'année parente (UUID)' })
  @ApiResponse({ status: 201, description: 'Semestre créé', type: SemestreResponseDto })
  @ApiResponse({ status: 404, description: 'Année parente non trouvée' })
  @ApiResponse({ status: 409, description: 'Semestre déjà existant' })
  async createSemestre(
    @Param('anneeId') anneeId: string,
    @Body() dto: CreateSemestreDto,
  ): Promise<SemestreResponseDto> {
    return this.anneesService.createSemestre({ ...dto, anneeId }, 'system');
  }

  @Get(':anneeId/semestres')
  @Permissions('annee:read')
  @ApiOperation({ summary: 'Lister les semestres d\'une année' })
  @ApiParam({ name: 'anneeId', description: 'ID de l\'année parente (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des semestres', type: PaginatedSemestresDto })
  async findAllSemestres(
    @Param('anneeId') anneeId: string,
    @Query() query: SemestreQueryDto,
  ): Promise<PaginatedSemestresDto> {
    return this.anneesService.findAllSemestres(anneeId, query);
  }

  @Get('semestres/:id')
  @Permissions('annee:read')
  @ApiOperation({ summary: 'Obtenir un semestre par ID' })
  @ApiParam({ name: 'id', description: 'ID du semestre (UUID)' })
  @ApiResponse({ status: 200, description: 'Semestre trouvé', type: SemestreResponseDto })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  async findSemestreById(@Param('id') id: string): Promise<SemestreResponseDto> {
    return this.anneesService.findSemestreById(id);
  }

  @Patch('semestres/:id')
  @Permissions('annee:write')
  @ApiOperation({ summary: 'Mettre à jour un semestre' })
  @ApiParam({ name: 'id', description: 'ID du semestre (UUID)' })
  @ApiResponse({ status: 200, description: 'Semestre mis à jour', type: SemestreResponseDto })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  @ApiResponse({ status: 409, description: 'Numéro de semestre déjà utilisé' })
  async updateSemestre(
    @Param('id') id: string,
    @Body() dto: UpdateSemestreDto,
  ): Promise<SemestreResponseDto> {
    return this.anneesService.updateSemestre(id, dto, 'system');
  }

  @Delete('semestres/:id')
  @Permissions('annee:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un semestre' })
  @ApiParam({ name: 'id', description: 'ID du semestre (UUID)' })
  @ApiResponse({ status: 204, description: 'Semestre supprimé' })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  async removeSemestre(@Param('id') id: string): Promise<void> {
    return this.anneesService.removeSemestre(id, 'system');
  }

  @Post('semestres/:id/creneaux/generate')
  @Permissions('creneaux:generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Générer la grille horaire d\'un semestre',
    description: 'Crée les créneaux consécutifs de 30 minutes pour chaque jour ouvré. Si dryRun=true, retourne uniquement le décompte sans écriture.',
  })
  @ApiParam({ name: 'id', description: 'ID du semestre (UUID)' })
  @ApiResponse({ status: 201, description: 'Grille générée', type: GenerateCreneauxResponseDto })
  @ApiResponse({ status: 400, description: 'Paramètres invalides (durée non conforme, pauses incohérentes)' })
  @ApiResponse({ status: 404, description: 'Semestre non trouvé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 409, description: 'Conflit : séance existante sur un créneau supprimé (SLOT_IN_USE)' })
  async generateCreneaux(
    @Param('id') id: string,
    @Body() dto: GenerateCreneauxDto,
  ): Promise<GenerateCreneauxResponseDto> {
    return this.anneesService.generateCreneaux(id, dto, 'system');
  }
}