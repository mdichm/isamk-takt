// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs des indisponibilités enseignants et salles (L1-20)
import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// eslint-disable-next-line no-restricted-imports
import { JourSemaine } from '@takt/db';

// ============================================
// Indisponibilités (L1-20)
// ============================================

export class CreateIndisponibiliteDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'LUNDI', enum: JourSemaine, description: 'Jour de la semaine' })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({ example: 3, description: 'Ordre du créneau dans la journée' })
  @IsInt()
  @Min(1)
  ordre: number;

  @ApiPropertyOptional({ example: 'uuid-enseignant', description: 'ID de l\'enseignant (XOR avec salleId)' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ example: 'uuid-salle', description: 'ID de la salle (XOR avec enseignantId)' })
  @IsOptional()
  @IsUUID()
  salleId?: string;
}

export class UpdateIndisponibiliteDto {
  @ApiPropertyOptional({ example: 'LUNDI', enum: JourSemaine })
  @IsOptional()
  @IsEnum(JourSemaine)
  jour?: JourSemaine;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ordre?: number;

  @ApiPropertyOptional({ example: 'uuid-enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ example: 'uuid-salle' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}

export class IndisponibiliteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ enum: JourSemaine })
  jour: JourSemaine;

  @ApiProperty()
  ordre: number;

  @ApiPropertyOptional()
  enseignantId?: string;

  @ApiPropertyOptional()
  salleId?: string;

  @ApiProperty()
  estActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IndisponibiliteQueryDto {
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
  @IsUUID()
  semestreId?: string;

  @ApiPropertyOptional({ enum: JourSemaine })
  @IsOptional()
  @IsEnum(JourSemaine)
  jour?: JourSemaine;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}

export class PaginatedIndisponibilitesDto {
  @ApiProperty({ type: [IndisponibiliteResponseDto] })
  data: IndisponibiliteResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}