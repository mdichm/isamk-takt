import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActivityQueryDto, ActivityResponseDto } from './dto/activity.dto.js';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, taskId: string, query: ActivityQueryDto, userId: string): Promise<ActivityResponseDto[]> {
    await this.checkTaskAccess(projectId, taskId, userId);

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { taskId };

    if (query.type) where.type = query.type;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const activities = await this.prisma.activity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
    });

    return activities.map(this.toResponseDto);
  }

  private async checkTaskAccess(projectId: string, taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
  }

  private toResponseDto(activity: any): ActivityResponseDto {
    return {
      id: activity.id,
      taskId: activity.taskId,
      userId: activity.userId,
      type: activity.type,
      field: activity.field,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: activity.user,
      task: activity.task,
    };
  }
}