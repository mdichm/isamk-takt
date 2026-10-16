import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskQueryDto, TaskResponseDto, PaginatedTasksDto, BulkUpdateTasksDto } from './dto/task.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Tâches')
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Permissions('task:write')
  @ApiOperation({ summary: 'Créer une nouvelle tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 201, description: 'Tâche créée', type: TaskResponseDto })
  async create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(projectId, createTaskDto, userId);
  }

  @Get()
  @Permissions('task:read')
  @ApiOperation({ summary: 'Lister les tâches d\'un projet avec pagination et filtres' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des tâches', type: PaginatedTasksDto })
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedTasksDto> {
    return this.tasksService.findAll(projectId, query, userId);
  }

  @Get(':id')
  @Permissions('task:read')
  @ApiOperation({ summary: 'Obtenir une tâche par ID' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 200, description: 'Tâche trouvée', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(projectId, id, userId);
  }

  @Patch(':id')
  @Permissions('task:write')
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 200, description: 'Tâche mise à jour', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(projectId, id, updateTaskDto, userId);
  }

  @Patch(':id/move')
  @Permissions('task:write')
  @ApiOperation({ summary: 'Déplacer une tâche (changer de colonne/statut)' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 200, description: 'Tâche déplacée', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async move(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() moveTaskDto: MoveTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.move(projectId, id, moveTaskDto, userId);
  }

  @Delete(':id')
  @Permissions('task:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'id', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 204, description: 'Tâche supprimée' })
  @ApiResponse({ status: 404, description: 'Tâche non trouvée' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.tasksService.remove(projectId, id, userId);
  }

  @Patch('bulk')
  @Permissions('task:write')
  @ApiOperation({ summary: 'Mise à jour en masse de plusieurs tâches' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiResponse({ status: 200, description: 'Tâches mises à jour' })
  async bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() bulkUpdateDto: BulkUpdateTasksDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.tasksService.bulkUpdate(projectId, bulkUpdateDto, userId);
  }
}