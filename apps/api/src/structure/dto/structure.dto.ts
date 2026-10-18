import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Départements
// ============================================

export class CreateDepartementDto {
  @ApiProperty({ example: '2026-2027', description: 'ID de l\'année universitaire parente' })
  @IsUUID()
  anneeId: string;

  @ApiProperty({ example: 'INFO', description: 'Code unique du département dans l\'année' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Informatique', description: 'Libellé du département' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-123', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateDepartementDto {
  @ApiPropertyOptional({ example: 'INFO' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Informatique' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class DepartementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  anneeId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  ordre: number;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DepartementQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
  @IsUUID()
  anneeId?: string;
}

export class PaginatedDepartementsDto {
  @ApiProperty({ type: [DepartementResponseDto] })
  data: DepartementResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ============================================
// Formations
// ============================================

export class CreateFormationDto {
  @ApiProperty({ example: 'uuid-departement', description: 'ID du département parent' })
  @IsUUID()
  departementId: string;

  @ApiProperty({ example: 'L3-INFO', description: 'Code unique de la formation dans le département' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Licence 3 Informatique', description: 'Libellé de la formation' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-456', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateFormationDto {
  @ApiPropertyOptional({ example: 'L3-INFO' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Licence 3 Informatique' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class FormationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  departementId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  ordre: number;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FormationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
  @IsUUID()
  departementId?: string;
}

export class PaginatedFormationsDto {
  @ApiProperty({ type: [FormationResponseDto] })
  data: FormationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ============================================
// Niveaux
// ============================================

export class CreateNiveauDto {
  @ApiProperty({ example: 'uuid-formation', description: 'ID de la formation parente' })
  @IsUUID()
  formationId: string;

  @ApiProperty({ example: 'L3', description: 'Code unique du niveau dans la formation' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Licence 3', description: 'Libellé du niveau' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-789', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateNiveauDto {
  @ApiPropertyOptional({ example: 'L3' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Licence 3' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordre d\'affichage dans la liste' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: 'EXT-789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class NiveauResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  formationId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  ordre: number;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NiveauQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
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
  @IsUUID()
  formationId?: string;
}

export class PaginatedNiveauxDto {
  @ApiProperty({ type: [NiveauResponseDto] })
  data: NiveauResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ============================================
// Reorder DTOs (L7-18)
// ============================================

export class ReorderItemDto {
  @ApiProperty({ description: 'ID de l\'élément à réordonner' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Nouvelle position (1-based)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordre: number;
}

export class ReorderDto {
  @ApiProperty({ type: [ReorderItemDto], description: 'Liste des éléments avec leur nouvel ordre' })
  @Type(() => ReorderItemDto)
  @IsArray()
  @ValidateNested({ each: true })
  items: ReorderItemDto[];
}