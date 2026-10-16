import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service.js';
import { ActivityQueryDto, ActivityResponseDto } from './dto/activity.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Permissions } from '../policy/decorators/permissions.decorator.js';

@ApiTags('Activités')
@Controller('projects/:projectId/tasks/:taskId/activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Permissions('activity:read')
  @Get()
  @ApiOperation({ summary: 'Obtenir l\'historique des activités d\'une tâche' })
  @ApiParam({ name: 'projectId', description: 'ID du projet (UUID)' })
  @ApiParam({ name: 'taskId', description: 'ID de la tâche (UUID)' })
  @ApiResponse({ status: 200, description: 'Liste des activités', type: [ActivityResponseDto] })
  async findAll(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Query() query: ActivityQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<ActivityResponseDto[]> {
    return this.activitiesService.findAll(projectId, taskId, query, userId);
  }
}