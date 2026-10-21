import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsIn, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type RepartitionStatut = 'BROUILLON' | 'VALIDEE' | 'ROUVERTE';

export const RepartitionStatut = {
  BROUILLON: 'BROUILLON' as const,
  VALIDEE: 'VALIDEE' as const,
  ROUVERTE: 'ROUVERTE' as const,
} as const;

export class CreateRepartitionDto {
  @ApiProperty({ description: 'ID du semestre (UUID)' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'ID du département (UUID)' })
  @IsUUID()
  departementId: string;

  @ApiPropertyOptional({ default: 'BROUILLON', enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: RepartitionStatut;

  @ApiPropertyOptional({ description: 'Libellé optionnel de la répartition' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  libelle?: string;
}

export class UpdateRepartitionDto {
  @ApiPropertyOptional({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: RepartitionStatut;

  @ApiPropertyOptional({ description: 'Libellé optionnel de la répartition' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  libelle?: string;
}

export class RepartitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  departementId: string;

  @ApiProperty({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  statut: RepartitionStatut;

  @ApiPropertyOptional()
  libelle?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedRepartitionsDto {
  @ApiProperty({ type: [RepartitionResponseDto] })
  data: RepartitionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class RepartitionQueryDto {
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

  @ApiPropertyOptional({ enum: ['BROUILLON', 'VALIDEE', 'ROUVERTE'] })
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDEE', 'ROUVERTE'])
  statut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departementId?: string;
}
