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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnseignantsService } from './enseignants.service.js';
import {
  CreateEnseignantDto,
  UpdateEnseignantDto,
  EnseignantResponseDto,
  PaginatedEnseignantsDto,
  EnseignantsQueryDto,
  AssignModulesDto,
} from './dto/enseignant.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Enseignants')
@Controller('enseignants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnseignantsController {
  constructor(private enseignantsService: EnseignantsService) {}

  @Post()
  @Permissions('enseignant:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un enseignant' })
  @ApiResponse({ status: 201, description: 'Enseignant créé', type: EnseignantResponseDto })
  @ApiResponse({ status: 409, description: 'Matricule ou email déjà existant' })
  @ApiResponse({ status: 404, description: 'Année, département ou grade non trouvé' })
  async create(
    @Body() dto: CreateEnseignantDto,
    @CurrentUser('id') userId: string,
  ): Promise<EnseignantResponseDto> {
    return this.enseignantsService.createEnseignant(dto, userId);
  }

  @Get()
  @Permissions('enseignant:read')
  @ApiOperation({ summary: 'Lister les enseignants (paginé, filtrés)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Taille de page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche texte' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par actif' })
  @ApiQuery({ name: 'departementId', required: false, type: String, description: 'Filtrer par département' })
  @ApiQuery({ name: 'gradeId', required: false, type: String, description: 'Filtrer par grade' })
  @ApiQuery({ name: 'anneeId', required: false, type: String, description: 'Filtrer par année' })
  @ApiResponse({ status: 200, description: 'Liste paginée', type: PaginatedEnseignantsDto })
  async findAll(
    @Query() query: EnseignantsQueryDto,
  ): Promise<PaginatedEnseignantsDto> {
    return this.enseignantsService.findAllEnseignants(query);
  }

  @Get(':id')
  @Permissions('enseignant:read')
  @ApiOperation({ summary: 'Obtenir un enseignant par ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant (UUID)' })
  @ApiResponse({ status: 200, description: 'Enseignant trouvé', type: EnseignantResponseDto })
  @ApiResponse({ status: 404, description: 'Enseignant non trouvé' })
  async findOne(
    @Param('id') id: string,
  ): Promise<EnseignantResponseDto> {
    return this.enseignantsService.findEnseignantById(id);
  }

  @Patch(':id')
  @Permissions('enseignant:write')
  @ApiOperation({ summary: 'Mettre à jour un enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant (UUID)' })
  @ApiResponse({ status: 200, description: 'Enseignant mis à jour', type: EnseignantResponseDto })
  @ApiResponse({ status: 404, description: 'Enseignant non trouvé' })
  @ApiResponse({ status: 409, description: 'Matricule ou email déjà existant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEnseignantDto,
    @CurrentUser('id') userId: string,
  ): Promise<EnseignantResponseDto> {
    return this.enseignantsService.updateEnseignant(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('enseignant:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un enseignant (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant (UUID)' })
  @ApiResponse({ status: 204, description: 'Enseignant désactivé' })
  @ApiResponse({ status: 404, description: 'Enseignant non trouvé' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.enseignantsService.removeEnseignant(id, userId);
  }

  @Post(':id/modules')
  @Permissions('enseignant:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assigner des modules enseignables à un enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant (UUID)' })
  @ApiResponse({ status: 201, description: 'Modules assignés', type: EnseignantResponseDto })
  @ApiResponse({ status: 404, description: 'Enseignant ou module non trouvé' })
  async assignModules(
    @Param('id') enseignantId: string,
    @Body() dto: AssignModulesDto,
    @CurrentUser('id') userId: string,
  ): Promise<EnseignantResponseDto> {
    return this.enseignantsService.assignModules(enseignantId, dto, userId);
  }

  @Delete(':id/modules/:moduleId')
  @Permissions('enseignant:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désassigner un module d\'un enseignant' })
  @ApiParam({ name: 'id', description: 'ID de l\'enseignant (UUID)' })
  @ApiParam({ name: 'moduleId', description: 'ID du module (UUID)' })
  @ApiResponse({ status: 204, description: 'Module désassigné' })
  @ApiResponse({ status: 404, description: 'Enseignant ou assignation non trouvé' })
  async unassignModule(
    @Param('id') enseignantId: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.enseignantsService.unassignModule(enseignantId, moduleId, userId);
  }
}