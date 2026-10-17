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
import { StructureService } from './structure.service.js';
import {
  CreateDepartementDto,
  UpdateDepartementDto,
  DepartementResponseDto,
  PaginatedDepartementsDto,
  DepartementQueryDto,
  CreateFormationDto,
  UpdateFormationDto,
  FormationResponseDto,
  PaginatedFormationsDto,
  FormationQueryDto,
  CreateNiveauDto,
  UpdateNiveauDto,
  NiveauResponseDto,
  PaginatedNiveauxDto,
  NiveauQueryDto,
} from './dto/structure.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Structure académique')
@Controller('structure')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StructureController {
  constructor(private structureService: StructureService) {}

  // ============================================
  // Départements
  // ============================================

  @Post('departements')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Créer un département' })
  @ApiResponse({ status: 201, description: 'Département créé', type: DepartementResponseDto })
  @ApiResponse({ status: 404, description: 'Année parente non trouvée' })
  @ApiResponse({ status: 409, description: 'Code de département déjà existant pour cette année' })
  async createDepartement(@Body() dto: CreateDepartementDto): Promise<DepartementResponseDto> {
    return this.structureService.createDepartement(dto, 'system');
  }

  @Get('departements')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Lister les départements avec pagination' })
  @ApiResponse({ status: 200, description: 'Liste paginée des départements', type: PaginatedDepartementsDto })
  async findAllDepartements(@Query() query: DepartementQueryDto): Promise<PaginatedDepartementsDto> {
    return this.structureService.findAllDepartements(query);
  }

  @Get('departements/:id')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Obtenir un département par ID' })
  @ApiParam({ name: 'id', description: 'ID du département (UUID)' })
  @ApiResponse({ status: 200, description: 'Département trouvé', type: DepartementResponseDto })
  @ApiResponse({ status: 404, description: 'Département non trouvé' })
  async findDepartementById(@Param('id') id: string): Promise<DepartementResponseDto> {
    return this.structureService.findDepartementById(id);
  }

  @Patch('departements/:id')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Mettre à jour un département' })
  @ApiParam({ name: 'id', description: 'ID du département (UUID)' })
  @ApiResponse({ status: 200, description: 'Département mis à jour', type: DepartementResponseDto })
  @ApiResponse({ status: 404, description: 'Département non trouvé' })
  @ApiResponse({ status: 409, description: 'Code de département déjà utilisé' })
  async updateDepartement(
    @Param('id') id: string,
    @Body() dto: UpdateDepartementDto,
  ): Promise<DepartementResponseDto> {
    return this.structureService.updateDepartement(id, dto, 'system');
  }

  @Delete('departements/:id')
  @Permissions('structure:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un département' })
  @ApiParam({ name: 'id', description: 'ID du département (UUID)' })
  @ApiResponse({ status: 204, description: 'Département supprimé' })
  @ApiResponse({ status: 404, description: 'Département non trouvé' })
  @ApiResponse({ status: 409, description: 'Le département est référencé par des formations' })
  async removeDepartement(@Param('id') id: string): Promise<void> {
    return this.structureService.removeDepartement(id, 'system');
  }

  // ============================================
  // Formations
  // ============================================

  @Post('departements/:departementId/formations')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Créer une formation pour un département' })
  @ApiParam({ name: 'departementId', description: 'ID du département parent (UUID)' })
  @ApiResponse({ status: 201, description: 'Formation créée', type: FormationResponseDto })
  @ApiResponse({ status: 404, description: 'Département parent non trouvé' })
  @ApiResponse({ status: 409, description: 'Code de formation déjà existant pour ce département' })
  async createFormation(
    @Param('departementId') departementId: string,
    @Body() dto: CreateFormationDto,
  ): Promise<FormationResponseDto> {
    return this.structureService.createFormation({ ...dto, departementId }, 'system');
  }

  @Get('departements/:departementId/formations')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Lister les formations d\'un département' })
  @ApiParam({ name: 'departementId', description: 'ID du département parent (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des formations', type: PaginatedFormationsDto })
  async findAllFormations(
    @Param('departementId') departementId: string,
    @Query() query: FormationQueryDto,
  ): Promise<PaginatedFormationsDto> {
    return this.structureService.findAllFormations({ ...query, departementId });
  }

  @Get('formations/:id')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Obtenir une formation par ID' })
  @ApiParam({ name: 'id', description: 'ID de la formation (UUID)' })
  @ApiResponse({ status: 200, description: 'Formation trouvée', type: FormationResponseDto })
  @ApiResponse({ status: 404, description: 'Formation non trouvée' })
  async findFormationById(@Param('id') id: string): Promise<FormationResponseDto> {
    return this.structureService.findFormationById(id);
  }

  @Patch('formations/:id')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Mettre à jour une formation' })
  @ApiParam({ name: 'id', description: 'ID de la formation (UUID)' })
  @ApiResponse({ status: 200, description: 'Formation mise à jour', type: FormationResponseDto })
  @ApiResponse({ status: 404, description: 'Formation non trouvée' })
  @ApiResponse({ status: 409, description: 'Code de formation déjà utilisé' })
  async updateFormation(
    @Param('id') id: string,
    @Body() dto: UpdateFormationDto,
  ): Promise<FormationResponseDto> {
    return this.structureService.updateFormation(id, dto, 'system');
  }

  @Delete('formations/:id')
  @Permissions('structure:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une formation' })
  @ApiParam({ name: 'id', description: 'ID de la formation (UUID)' })
  @ApiResponse({ status: 204, description: 'Formation supprimée' })
  @ApiResponse({ status: 404, description: 'Formation non trouvée' })
  @ApiResponse({ status: 409, description: 'La formation est référencée par des niveaux' })
  async removeFormation(@Param('id') id: string): Promise<void> {
    return this.structureService.removeFormation(id, 'system');
  }

  // ============================================
  // Niveaux
  // ============================================

  @Post('formations/:formationId/niveaux')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Créer un niveau pour une formation' })
  @ApiParam({ name: 'formationId', description: 'ID de la formation parente (UUID)' })
  @ApiResponse({ status: 201, description: 'Niveau créé', type: NiveauResponseDto })
  @ApiResponse({ status: 404, description: 'Formation parente non trouvée' })
  @ApiResponse({ status: 409, description: 'Code de niveau déjà existant pour cette formation' })
  async createNiveau(
    @Param('formationId') formationId: string,
    @Body() dto: CreateNiveauDto,
  ): Promise<NiveauResponseDto> {
    return this.structureService.createNiveau({ ...dto, formationId }, 'system');
  }

  @Get('formations/:formationId/niveaux')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Lister les niveaux d\'une formation' })
  @ApiParam({ name: 'formationId', description: 'ID de la formation parente (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des niveaux', type: PaginatedNiveauxDto })
  async findAllNiveaux(
    @Param('formationId') formationId: string,
    @Query() query: NiveauQueryDto,
  ): Promise<PaginatedNiveauxDto> {
    return this.structureService.findAllNiveaux({ ...query, formationId });
  }

  @Get('niveaux/:id')
  @Permissions('structure:read')
  @ApiOperation({ summary: 'Obtenir un niveau par ID' })
  @ApiParam({ name: 'id', description: 'ID du niveau (UUID)' })
  @ApiResponse({ status: 200, description: 'Niveau trouvé', type: NiveauResponseDto })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé' })
  async findNiveauById(@Param('id') id: string): Promise<NiveauResponseDto> {
    return this.structureService.findNiveauById(id);
  }

  @Patch('niveaux/:id')
  @Permissions('structure:write')
  @ApiOperation({ summary: 'Mettre à jour un niveau' })
  @ApiParam({ name: 'id', description: 'ID du niveau (UUID)' })
  @ApiResponse({ status: 200, description: 'Niveau mis à jour', type: NiveauResponseDto })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé' })
  @ApiResponse({ status: 409, description: 'Code de niveau déjà utilisé' })
  async updateNiveau(
    @Param('id') id: string,
    @Body() dto: UpdateNiveauDto,
  ): Promise<NiveauResponseDto> {
    return this.structureService.updateNiveau(id, dto, 'system');
  }

  @Delete('niveaux/:id')
  @Permissions('structure:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un niveau' })
  @ApiParam({ name: 'id', description: 'ID du niveau (UUID)' })
  @ApiResponse({ status: 204, description: 'Niveau supprimé' })
  @ApiResponse({ status: 404, description: 'Niveau non trouvé' })
  async removeNiveau(@Param('id') id: string): Promise<void> {
    return this.structureService.removeNiveau(id, 'system');
  }
}