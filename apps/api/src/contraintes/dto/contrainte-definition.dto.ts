import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { ContrainteCategorie, ContraintePortee, FetSupport } from '@takt/db';

export type ContrainteCategorieType = ContrainteCategorie;
export type ContraintePorteeType = ContraintePortee;
export type FetSupportType = FetSupport;

export const ContrainteCategorieValues = {
  DURE: 'DURE' as const,
  SOUPLE: 'SOUPLE' as const,
} as const;

export const ContraintePorteeValues = {
  GLOBALE: 'GLOBALE' as const,
  ENSEIGNANT: 'ENSEIGNANT' as const,
  GROUPE: 'GROUPE' as const,
  SALLE: 'SALLE' as const,
  MODULE: 'MODULE' as const,
} as const;

export const FetSupportValues = {
  NATIF: 'NATIF' as const,
  PARTIEL: 'PARTIEL' as const,
  AUCUN: 'AUCUN' as const,
} as const;

export class ContrainteDefinitionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty({ enum: ['DURE', 'SOUPLE'] })
  categorie: ContrainteCategorieType;

  @ApiProperty({ enum: ['GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE'] })
  portee: ContraintePorteeType;

  @ApiProperty()
  paramsSchema: Record<string, unknown>;

  @ApiProperty({ enum: ['NATIF', 'PARTIEL', 'AUCUN'], default: 'NATIF' })
  fetSupport: FetSupportType;

  @ApiProperty({ default: true })
  actif: boolean;
}

export class ContrainteDefinitionListQueryDto {
  @ApiPropertyOptional({ default: true, description: 'Filtrer par définitions actives' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean = true;

  @ApiPropertyOptional({ enum: ['DURE', 'SOUPLE'] })
  @IsOptional()
  @IsIn(['DURE', 'SOUPLE'])
  categorie?: ContrainteCategorieType;

  @ApiPropertyOptional({ enum: ['GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE'] })
  @IsOptional()
  @IsIn(['GLOBALE', 'ENSEIGNANT', 'GROUPE', 'SALLE', 'MODULE'])
  portee?: ContraintePorteeType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class PaginatedContrainteDefinitionsDto {
  @ApiProperty({ type: [ContrainteDefinitionResponseDto] })
  data: ContrainteDefinitionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}