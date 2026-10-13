import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto, ProjectResponseDto, PaginatedProjectsDto, AddMemberDto, UpdateMemberRoleDto } from './dto/project.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Projets')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau projet' })
  @ApiResponse({ status: 201, description: 'Projet créé', type: ProjectResponseDto })
  @ApiResponse({ status: 409, description: 'Clé de projet déjà utilisée' })
  async create(@Body() createProjectDto: CreateProjectDto, @CurrentUser('id') userId: string): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les projets de l\'utilisateur avec pagination et filtres' })
  @ApiResponse({ status: 200, description: 'Liste paginée des projets', type: PaginatedProjectsDto })
  async findAll(@Query() query: ProjectQueryDto, @CurrentUser('id') userId: string): Promise<PaginatedProjectsDto> {
    return this.projectsService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un projet par ID' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Projet trouvé', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Projet mis à jour', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @CurrentUser('id') userId: string): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 204, description: 'Projet supprimé' })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string): Promise<void> {
    return this.projectsService.remove(id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Obtenir les membres d\'un projet' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des membres' })
  async getMembers(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.projectsService.getMembers(id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Ajouter un membre au projet' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 201, description: 'Membre ajouté' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
  async addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @CurrentUser('id') userId: string): Promise<void> {
    return this.projectsService.addMember(id, addMemberDto, userId);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Mettre à jour le rôle d\'un membre' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'memberId', description: 'ID du membre (UUID)' })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour' })
  async updateMemberRole(@Param('id') id: string, @Param('memberId') memberId: string, @Body() updateMemberRoleDto: UpdateMemberRoleDto, @CurrentUser('id') userId: string): Promise<void> {
    return this.projectsService.updateMemberRole(id, memberId, updateMemberRoleDto, userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un membre du projet' })
  @ApiParam({ name: 'id', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'memberId', description: 'ID du membre (UUID)' })
  @ApiResponse({ status: 204, description: 'Membre retiré' })
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser('id') userId: string): Promise<void> {
    return this.projectsService.removeMember(id, memberId, userId);
  }
}