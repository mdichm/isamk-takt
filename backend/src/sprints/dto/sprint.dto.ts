import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Objectif du sprint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-14' })
  @IsDateString()
  endDate: string;
}

export class UpdateSprintDto {
  @ApiPropertyOptional({ example: 'Sprint 1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Objectif du sprint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-01-14' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SprintResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  goal: string | null;

  @ApiProperty({ enum: SprintStatus })
  status: SprintStatus;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  _count?: {
    tasks: number;
    members: number;
  };
}

export class PaginatedSprintsDto {
  @ApiProperty({ type: [SprintResponseDto] })
  data: SprintResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SprintQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsString()
  page?: string = '1';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsString()
  limit?: string = '10';

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}

export class AddSprintMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}