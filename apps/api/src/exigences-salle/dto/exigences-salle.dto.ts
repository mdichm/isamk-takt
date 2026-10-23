// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs des exigences de salle par activité (L3-43)
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Exigences de salle par activité (L3-43)
// ============================================

export class CreateExigenceSalleActiviteDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({
    example: 'groupe-1:module-1:type-1:enseignant-1',
    description: "Clé d'affectation (groupe:module:type:enseignant)",
  })
  @IsString()
  @MinLength(1)
  affectationKey: string;

  @ApiPropertyOptional({
    example: 'uuid-salle',
    description: "ID de la salle imposée (optionnel)",
  })
  @IsOptional()
  @IsUUID()
  salleImposeeId?: string;

  @ApiPropertyOptional({
    example: ['uuid-salle-1', 'uuid-salle-2'],
    description: 'Liste des salles autorisées (optionnel)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  autorisees?: string[];
}

export class UpdateExigenceSalleActiviteDto {
  @ApiPropertyOptional({ example: 'uuid-salle', description: 'Salle imposée' })
  @IsOptional()
  @IsUUID()
  salleImposeeId?: string;

  @ApiPropertyOptional({
    example: ['uuid-salle-1', 'uuid-salle-2'],
    description: 'Liste des salles autorisées',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  autorisees?: string[];
}

export class ExigenceSalleAutoriseeDto {
  @ApiProperty()
  salleId: string;

  @ApiPropertyOptional({ example: 'AMPHI-A', description: 'Code de la salle' })
  code?: string;

  @ApiPropertyOptional({ example: 'Amphithéâtre A', description: 'Libellé' })
  libelle?: string;
}

export class ExigenceSalleActiviteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({
    example: 'groupe-1:module-1:type-1:enseignant-1',
  })
  affectationKey: string;

  @ApiPropertyOptional({ example: 'uuid-salle' })
  salleImposeeId?: string;

  @ApiPropertyOptional({ example: 'AMPHI-A' })
  salleImposeeCode?: string;

  @ApiPropertyOptional({ type: [ExigenceSalleAutoriseeDto] })
  autorisees: ExigenceSalleAutoriseeDto[];

  @ApiProperty()
  creePar: string;

  @ApiProperty()
  creeLe: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ExigenceSalleQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  semestreId?: string;
}
