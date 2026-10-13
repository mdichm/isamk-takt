import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

export class ActivityQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string = '1';

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsString()
  limit?: string = '20';

  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  taskId: string | null;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ActivityType })
  type: ActivityType;

  @ApiPropertyOptional()
  field: string | null;

  @ApiPropertyOptional()
  oldValue: string | null;

  @ApiPropertyOptional()
  newValue: string | null;

  @ApiPropertyOptional()
  metadata: any;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };

  @ApiPropertyOptional()
  task?: {
    id: string;
    title: string;
  };
}