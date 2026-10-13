import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TagsService } from './tags.service.js';
import { CreateTagDto, UpdateTagDto, TagResponseDto } from './dto/tag.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Tags')
@Controller('projects/:projectId/tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau tag' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 201, description: 'Tag créé', type: TagResponseDto })
  @ApiResponse({ status: 409, description: 'Tag déjà existant' })
  async create(
    @Param('projectId') projectId: string,
    @Body() createTagDto: CreateTagDto,
    @CurrentUser('id') userId: string,
  ): Promise<TagResponseDto> {
    return this.tagsService.create(projectId, createTagDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tags d\'un projet' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des tags', type: [TagResponseDto] })
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<TagResponseDto[]> {
    return this.tagsService.findAll(projectId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un tag par ID' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du tag (UUID)' })
  @ApiResponse({ status: 200, description: 'Tag trouvé', type: TagResponseDto })
  @ApiResponse({ status: 404, description: 'Tag non trouvé' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<TagResponseDto> {
    return this.tagsService.findOne(projectId, id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un tag' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du tag (UUID)' })
  @ApiResponse({ status: 200, description: 'Tag mis à jour', type: TagResponseDto })
  @ApiResponse({ status: 404, description: 'Tag non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom de tag déjà utilisé' })
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentUser('id') userId: string,
  ): Promise<TagResponseDto> {
    return this.tagsService.update(projectId, id, updateTagDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un tag' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du tag (UUID)' })
  @ApiResponse({ status: 204, description: 'Tag supprimé' })
  @ApiResponse({ status: 404, description: 'Tag non trouvé' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.tagsService.remove(projectId, id, userId);
  }
}