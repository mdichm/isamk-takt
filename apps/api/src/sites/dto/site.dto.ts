// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du référentiel des sites (L1-14)
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Référentiel des sites (L1-14)
// ============================================

export class CreateSiteDto {
  @ApiProperty({ example: 'SITE-PRINCIPAL', description: 'Code unique du site' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Campus Principal', description: 'Libellé du site' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  libelle: string;

  @ApiPropertyOptional({ default: false, description: 'Site principal' })
  @IsOptional()
  @IsBoolean()
  estPrincipal?: boolean;
}

export class UpdateSiteDto {
  @ApiPropertyOptional({ example: 'Campus Principal' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  libelle?: string;

  @ApiPropertyOptional({ description: 'Site principal' })
  @IsOptional()
  @IsBoolean()
  estPrincipal?: boolean;
}

export class SiteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  estPrincipal: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedSitesDto {
  @ApiProperty({ type: [SiteResponseDto] })
  data: SiteResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SitesQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estPrincipal?: boolean;
}

export class SalleParSiteQueryDto {
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