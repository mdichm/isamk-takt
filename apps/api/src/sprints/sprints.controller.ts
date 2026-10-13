import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SprintsService } from './sprints.service.js';
import { CreateSprintDto, UpdateSprintDto, SprintQueryDto, SprintResponseDto, PaginatedSprintsDto, AddSprintMemberDto } from './dto/sprint.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Sprints')
@Controller('projects/:projectId/sprints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 201, description: 'Sprint créé', type: SprintResponseDto })
  async create(
    @Param('projectId') projectId: string,
    @Body() createSprintDto: CreateSprintDto,
    @CurrentUser('id') userId: string,
  ): Promise<SprintResponseDto> {
    return this.sprintsService.create(projectId, createSprintDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les sprints d\'un projet avec pagination et filtres' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des sprints', type: PaginatedSprintsDto })
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: SprintQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedSprintsDto> {
    return this.sprintsService.findAll(projectId, query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un sprint par ID' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 200, description: 'Sprint trouvé', type: SprintResponseDto })
  @ApiResponse({ status: 404, description: 'Sprint non trouvé' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<SprintResponseDto> {
    return this.sprintsService.findOne(projectId, id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 200, description: 'Sprint mis à jour', type: SprintResponseDto })
  @ApiResponse({ status: 404, description: 'Sprint non trouvé' })
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSprintDto: UpdateSprintDto,
    @CurrentUser('id') userId: string,
  ): Promise<SprintResponseDto> {
    return this.sprintsService.update(projectId, id, updateSprintDto, userId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Démarrer un sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 200, description: 'Sprint démarré', type: SprintResponseDto })
  @ApiResponse({ status: 400, description: 'Sprint ne peut pas être démarré' })
  async start(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<SprintResponseDto> {
    return this.sprintsService.start(projectId, id, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Terminer un sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 200, description: 'Sprint terminé', type: SprintResponseDto })
  @ApiResponse({ status: 400, description: 'Sprint ne peut pas être terminé' })
  async complete(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<SprintResponseDto> {
    return this.sprintsService.complete(projectId, id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 204, description: 'Sprint supprimé' })
  @ApiResponse({ status: 404, description: 'Sprint non trouvé' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer un sprint actif' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sprintsService.remove(projectId, id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Obtenir les membres d\'un sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  async getMembers(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sprintsService.getMembers(projectId, id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre au sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
  async addMember(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() addMemberDto: AddSprintMemberDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sprintsService.addMember(projectId, id, addMemberDto, userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un membre du sprint' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du sprint (UUID)' })
  @ApiParam({ name: 'memberId', description: 'ID du membre (UUID)' })
  @ApiResponse({ status: 204, description: 'Membre retiré' })
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sprintsService.removeMember(projectId, id, memberId, userId);
  }
}
