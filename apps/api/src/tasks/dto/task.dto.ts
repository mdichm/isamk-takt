import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsUUID, IsInt, Min, Max, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@takt/db';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implémenter l\'authentification' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Description détaillée de la tâche' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 5, description: 'Points d\'effort (story points)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  storyPoints?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID de la colonne (pour le board Kanban)' })
  @IsOptional()
  @IsUUID()
  columnId?: string;

  @ApiPropertyOptional({ description: 'ID du sprint' })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'ID de la tâche parente (pour les sous-tâches)' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'assigné' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs des tags' })
  @IsOptional()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Implémenter l\'authentification' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Description détaillée de la tâche' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  storyPoints?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID de la colonne (pour le board Kanban)' })
  @IsOptional()
  @IsUUID()
  columnId?: string;

  @ApiPropertyOptional({ description: 'Position dans la colonne' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'ID du sprint' })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ description: 'ID de la tâche parente' })
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ description: 'ID de l\'assigné' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs des tags' })
  @IsOptional()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

export class MoveTaskDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({ description: 'ID de la colonne cible' })
  @IsOptional()
  @IsUUID()
  columnId?: string;

  @ApiProperty({ example: 0, description: 'Nouvelle position dans la colonne' })
  @IsInt()
  @Min(0)
  position: number;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  columnId: string | null;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiPropertyOptional()
  storyPoints: number | null;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  dueDate: Date | null;

  @ApiPropertyOptional()
  startedAt: Date | null;

  @ApiPropertyOptional()
  completedAt: Date | null;

  @ApiPropertyOptional()
  assigneeId: string | null;

  @ApiProperty()
  creatorId: string;

  @ApiPropertyOptional()
  sprintId: string | null;

  @ApiPropertyOptional()
  parentTaskId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };

  @ApiPropertyOptional()
  tags?: Array<{ id: string; name: string; color: string }>;

  @ApiPropertyOptional()
  subtasks?: TaskResponseDto[];

  @ApiPropertyOptional()
  _count?: {
    comments: number;
    subtasks: number;
  };
}

export class PaginatedTasksDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class TaskQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string = '1';

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsString()
  limit?: string = '20';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  columnId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentTaskId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeSubtasks?: string = 'false';
}

export class BulkUpdateTasksDto {
  @ApiProperty({ type: [String] })
  @IsUUID('4', { each: true })
  taskIds: string[];

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  columnId?: string;
}
