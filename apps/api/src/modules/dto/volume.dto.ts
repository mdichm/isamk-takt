import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export const VolumeTypeValues = ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const;
export type VolumeType = (typeof VolumeTypeValues)[number];

export const VolumeType = {
  CM: 'CM' as VolumeType,
  TD: 'TD' as VolumeType,
  TP: 'TP' as VolumeType,
  CI: 'CI' as VolumeType,
  AUTRE: 'AUTRE' as VolumeType,
} as const;

// ============================================
// Module Volumes (L2-01)
// ============================================

export class CreateModuleVolumeDto {
  @ApiProperty({ description: 'ID du module parent' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ enum: VolumeTypeValues, description: 'Type d\'enseignement (CM, TD, TP, CI, AUTRE)' })
  @IsIn(VolumeTypeValues)
  type: VolumeType;

  @ApiProperty({ example: 90, description: 'Volume en minutes (multiple de 30)' })
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(960)
  volume: number;
}

export class UpdateModuleVolumeDto {
  @ApiPropertyOptional({ enum: VolumeTypeValues, description: 'Type d\'enseignement' })
  @IsOptional()
  @IsIn(VolumeTypeValues)
  type?: VolumeType;

  @ApiPropertyOptional({ example: 120, description: 'Volume en minutes (multiple de 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(960)
  volume?: number;
}

export class ModuleVolumeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty({ enum: VolumeTypeValues })
  type: VolumeType;

  @ApiProperty()
  volume: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ModuleVolumesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedModuleVolumesDto {
  @ApiProperty({ type: [ModuleVolumeResponseDto] })
  data: ModuleVolumeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}