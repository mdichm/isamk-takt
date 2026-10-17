import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type GroupeType = 'SECTION' | 'GROUPE' | 'SOUS_GROUPE';

export const GroupeType = {
  SECTION: 'SECTION' as const,
  GROUPE: 'GROUPE' as const,
  SOUS_GROUPE: 'SOUS_GROUPE' as const,
} as const;

export class CreateGroupeDto {
  @ApiProperty({ description: 'ID du niveau parent' })
  @IsUUID()
  niveauId: string;

  @ApiProperty({ description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiPropertyOptional({ description: 'ID du groupe parent (null pour une section racine)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: ['SECTION', 'GROUPE', 'SOUS_GROUPE'], description: 'Type de groupe' })
  @IsIn(['SECTION', 'GROUPE', 'SOUS_GROUPE'])
  type: GroupeType;

  @ApiProperty({ example: 'INFO-L3-S1', description: 'Code unique du groupe' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'L3 Informatique Semestre 1', description: 'Libellé du groupe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ default: 0, description: 'Effectif du groupe' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  effectif?: number;
}

export class UpdateGroupeDto {
  @ApiPropertyOptional({ example: 'INFO-L3-S2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'L3 Informatique Semestre 2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  effectif?: number;

  @ApiPropertyOptional({ description: 'ID du nouveau groupe parent' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class GroupeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  niveauId: string;

  @ApiProperty()
  semestreId: string;

  @ApiPropertyOptional()
  parentId: string | null;

  @ApiProperty({ enum: ['SECTION', 'GROUPE', 'SOUS_GROUPE'] })
  type: GroupeType;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  effectif: number;

  @ApiPropertyOptional()
  originId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedGroupesDto {
  @ApiProperty({ type: [GroupeResponseDto] })
  data: GroupeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class GroupeQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['SECTION', 'GROUPE', 'SOUS_GROUPE'] })
  @IsOptional()
  @IsIn(['SECTION', 'GROUPE', 'SOUS_GROUPE'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  niveauId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}