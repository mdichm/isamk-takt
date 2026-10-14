import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskQueryDto, TaskResponseDto, PaginatedTasksDto, BulkUpdateTasksDto } from './dto/task.dto.js';
import { TaskStatus, TaskPriority } from '@takt/db';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createTaskDto: CreateTaskDto, userId: string): Promise<TaskResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const column = createTaskDto.columnId
      ? await this.prisma.boardColumn.findFirst({ where: { id: createTaskDto.columnId, projectId } })
      : await this.prisma.boardColumn.findFirst({ where: { projectId, position: 0 } });

    if (!column) {
      throw new NotFoundException('Aucune colonne disponible');
    }

    const maxPosition = await this.prisma.task.aggregate({
      where: { columnId: column.id },
      _max: { position: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId,
        columnId: column.id,
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || TaskStatus.TODO,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        storyPoints: createTaskDto.storyPoints,
        position: maxPosition._max.position ? maxPosition._max.position + 1 : 0,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        sprintId: createTaskDto.sprintId,
        parentTaskId: createTaskDto.parentTaskId,
        creatorId: userId,
        assigneeId: createTaskDto.assigneeId,
        tags: createTaskDto.tagIds?.length
          ? { connect: createTaskDto.tagIds.map((tagId) => ({ tagId })) as any }
          : undefined,
      },
      include: this.getTaskInclude(),
    });

    await this.logActivity(task.id, userId, 'CREATED', null, null, { title: task.title });
    return this.toResponseDto(task);
  }

  async findAll(projectId: string, query: TaskQueryDto, userId: string): Promise<PaginatedTasksDto> {
    await this.checkProjectAccess(projectId, userId);

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { projectId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.sprintId) where.sprintId = query.sprintId;
    if (query.columnId) where.columnId = query.columnId;
    if (query.parentTaskId) where.parentTaskId = query.parentTaskId;
    if (query.tagIds?.length) where.tags = { some: { tagId: { in: query.tagIds } } };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
        include: this.getTaskInclude(query.includeSubtasks === 'true'),
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map(this.toResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(projectId: string, taskId: string, userId: string): Promise<TaskResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: this.getTaskInclude(true),
    });
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }
    return this.toResponseDto(task);
  }async update(projectId: string, taskId: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<TaskResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const existingTask = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!existingTask) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (updateTaskDto.status !== undefined && updateTaskDto.status !== existingTask.status) {
      oldValues.status = existingTask.status;
      newValues.status = updateTaskDto.status;
    }
    if (updateTaskDto.priority !== undefined && updateTaskDto.priority !== existingTask.priority) {
      oldValues.priority = existingTask.priority;
      newValues.priority = updateTaskDto.priority;
    }
    if (updateTaskDto.columnId !== undefined && updateTaskDto.columnId !== existingTask.columnId) {
      oldValues.columnId = existingTask.columnId;
      newValues.columnId = updateTaskDto.columnId;
    }
    if (updateTaskDto.assigneeId !== undefined && updateTaskDto.assigneeId !== existingTask.assigneeId) {
      oldValues.assigneeId = existingTask.assigneeId;
      newValues.assigneeId = updateTaskDto.assigneeId;
    }

    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    }
    if (updateTaskDto.tagIds !== undefined) {
      updateData.tags = { set: updateTaskDto.tagIds.map((tagId) => ({ tagId })) as any };
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: this.getTaskInclude(),
    });

    if (Object.keys(oldValues).length > 0) {
      await this.logActivity(taskId, userId, 'UPDATED', JSON.stringify(oldValues), JSON.stringify(newValues));
      if (newValues.status) {
        await this.logActivity(taskId, userId, 'STATUS_CHANGED', oldValues.status, newValues.status);
      }
      if (newValues.assigneeId !== undefined) {
        await this.logActivity(taskId, userId, 'ASSIGNED', oldValues.assigneeId, newValues.assigneeId);
      }
      if (newValues.columnId !== undefined) {
        await this.logActivity(taskId, userId, 'MOVED', oldValues.columnId, newValues.columnId);
      }
    }

    return this.toResponseDto(task);
  }

  async move(projectId: string, taskId: string, moveTaskDto: MoveTaskDto, userId: string): Promise<TaskResponseDto> {
    await this.checkProjectAccess(projectId, userId);

    const existingTask = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!existingTask) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const targetColumn = moveTaskDto.columnId
      ? await this.prisma.boardColumn.findFirst({ where: { id: moveTaskDto.columnId, projectId } })
      : await this.prisma.boardColumn.findFirst({ where: { projectId, isDone: moveTaskDto.status === TaskStatus.DONE } });

    if (!targetColumn) {
      throw new NotFoundException('Colonne cible non trouvée');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { columnId: targetColumn.id, position: { gte: moveTaskDto.position } },
        data: { position: { increment: 1 } },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: targetColumn.id,
          status: moveTaskDto.status,
          position: moveTaskDto.position,
          startedAt: moveTaskDto.status === TaskStatus.IN_PROGRESS && !existingTask.startedAt ? new Date() : existingTask.startedAt,
          completedAt: moveTaskDto.status === TaskStatus.DONE ? new Date() : existingTask.completedAt,
        },
      });
    });

    await this.logActivity(taskId, userId, 'MOVED', existingTask.columnId, targetColumn.id, { status: moveTaskDto.status });
    await this.logActivity(taskId, userId, 'STATUS_CHANGED', existingTask.status, moveTaskDto.status);

    return this.findOne(projectId, taskId, userId);
  }

  async remove(projectId: string, taskId: string, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId);

    const task = await this.prisma.task.findFirst({ where: { id: taskId, projectId } });
    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    await this.logActivity(taskId, userId, 'DELETED', null, null, { title: task.title });
  }

  async bulkUpdate(projectId: string, bulkUpdateDto: BulkUpdateTasksDto, userId: string): Promise<void> {
    await this.checkProjectAccess(projectId, userId);

    const updateData: any = {};
    if (bulkUpdateDto.status) updateData.status = bulkUpdateDto.status;
    if (bulkUpdateDto.priority) updateData.priority = bulkUpdateDto.priority;
    if (bulkUpdateDto.assigneeId) updateData.assigneeId = bulkUpdateDto.assigneeId;
    if (bulkUpdateDto.sprintId) updateData.sprintId = bulkUpdateDto.sprintId;
    if (bulkUpdateDto.columnId) updateData.columnId = bulkUpdateDto.columnId;

    await this.prisma.task.updateMany({
      where: { id: { in: bulkUpdateDto.taskIds }, projectId },
      data: updateData,
    });
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('Accès non autorisé à ce projet');
    }
  }

  private getTaskInclude(includeSubtasks = false) {
    return {
      assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      tags: { include: { tag: true } },
      subtasks: includeSubtasks ? { include: { assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } } : false,
      _count: { select: { comments: true, subtasks: true } },
    };
  }

  private async logActivity(
    taskId: string,
    userId: string,
    type: any,
    oldValue: string | null,
    newValue: string | null,
    metadata?: any
  ) {
    await this.prisma.activity.create({
      data: { taskId, userId, type, oldValue, newValue, metadata },
    });
  }

  private toResponseDto(task: any): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      columnId: task.columnId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      storyPoints: task.storyPoints,
      position: task.position,
      dueDate: task.dueDate,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      assigneeId: task.assigneeId,
      creatorId: task.creatorId,
      sprintId: task.sprintId,
      parentTaskId: task.parentTaskId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee,
      tags: task.tags?.map((t: any) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
      subtasks: task.subtasks?.map(this.toResponseDto),
      _count: task._count,
    };
  }
}
