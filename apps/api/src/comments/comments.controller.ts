import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto/comment.dto.js';
import { IfMatch } from '../common/decorators/if-match.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Commentaires')
@Controller('projects/:projectId/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @Permissions('comment:write')
  @ApiOperation({ summary: 'Ajouter un commentaire à une tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 201, description: 'Commentaire créé', type: CommentResponseDto })
  async create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(projectId, taskId, createCommentDto, userId);
  }

  @Get()
  @Permissions('comment:read')
  @ApiOperation({ summary: 'Lister les commentaires d\'une tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des commentaires', type: [CommentResponseDto] })
  async findAll(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findAll(projectId, taskId, userId);
  }

  @Patch(':id')
  @Permissions('comment:write')
  @ApiOperation({ summary: 'Mettre à jour un commentaire' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du commentaire (UUID)' })
  @ApiResponse({ status: 200, description: 'Commentaire mis à jour', type: CommentResponseDto })
  @ApiResponse({ status: 404, description: 'Commentaire non trouvé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à modifier ce commentaire' })
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
    @IfMatch() _ifMatch: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(projectId, taskId, id, updateCommentDto, userId);
  }

  @Delete(':id')
  @Permissions('comment:write')
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche (UUID)' })
  @ApiParam({ name: 'id', description: 'ID du commentaire (UUID)' })
  @ApiResponse({ status: 204, description: 'Commentaire supprimé' })
  @ApiResponse({ status: 404, description: 'Commentaire non trouvé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à supprimer ce commentaire' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @IfMatch() _ifMatch: string,
  ): Promise<void> {
    return this.commentsService.remove(projectId, taskId, id, userId);
  }
}