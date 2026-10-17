import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type AnneeStatut = 'PREPARATION' | 'ACTIVE' | 'CLOTUREE';

export const AnneeStatut = {
  PREPARATION: 'PREPARATION' as const,
  ACTIVE: 'ACTIVE' as const,
  CLOTUREE: 'CLOTUREE' as const,
} as const;

export class CreateAnneeDto {
  @ApiProperty({ example: 2026, description: 'Numéro de l\'année universitaire' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  numero: number;

  @ApiProperty({ example: '2026-2027', description: 'Code unique de l\'année' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({ default: 14, description: 'Nombre de semaines du semestre' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  nbSemaines?: number;
}

export class UpdateAnneeDto {
  @ApiPropertyOptional({ example: '2026-2028' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  numero?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  nbSemaines?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['PREPARATION', 'ACTIVE', 'CLOTUREE'] })
  @IsOptional()
  @IsIn(['PREPARATION', 'ACTIVE', 'CLOTUREE'])
  statut?: string;
}

export class AnneeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  numero: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  nbSemaines: number;

  @ApiProperty({ enum: ['PREPARATION', 'ACTIVE', 'CLOTUREE'] })
  statut: AnneeStatut;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedAnneesDto {
  @ApiProperty({ type: [AnneeResponseDto] })
  data: AnneeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AnneeQueryDto {
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

  @ApiPropertyOptional({ enum: ['PREPARATION', 'ACTIVE', 'CLOTUREE'] })
  @IsOptional()
  @IsIn(['PREPARATION', 'ACTIVE', 'CLOTUREE'])
  statut?: string;
}

export class TransitionAnneeDto {
  @ApiProperty({ enum: ['ACTIVER', 'CLOTURER'] })
  @IsIn(['ACTIVER', 'CLOTURER'])
  action: 'ACTIVER' | 'CLOTURER';

  @ApiPropertyOptional({ default: false, description: 'Confirmer la transition (requis pour CLOTURER)' })
  @IsOptional()
  @Type(() => Boolean)
  confirmation?: boolean;
}

export class CreateSemestreDto {
  @ApiProperty({ description: 'ID de l\'année parente' })
  @IsUUID()
  anneeId: string;

  @ApiProperty({ example: 1, description: 'Numéro du semestre (1 ou 2)' })
  @IsInt()
  @Min(1)
  @Max(2)
  numero: number;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  nbSemaines?: number;
}

export class UpdateSemestreDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  numero?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  nbSemaines?: number;
}

export class SemestreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  anneeId: string;

  @ApiProperty()
  numero: number;

  @ApiProperty()
  nbSemaines: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedSemestresDto {
  @ApiProperty({ type: [SemestreResponseDto] })
  data: SemestreResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SemestreQueryDto {
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