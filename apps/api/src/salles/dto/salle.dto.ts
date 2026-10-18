import { IsString, IsOptional, MinLength, MaxLength, IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Types de salle
// ============================================

export class CreateTypeSalleDto {
  @ApiProperty({ example: 'AMPHI', description: 'Code unique du type de salle' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Amphithéâtre', description: 'Libellé du type de salle' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: true, description: 'Le type de salle est actif' })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional({ example: 'EXT-123', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateTypeSalleDto {
  @ApiPropertyOptional({ example: 'AMPHI' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Amphithéâtre' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional({ example: 'EXT-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class TypeSalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  estActive: boolean;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TypeSalleQueryDto {
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
  @IsBoolean()
  estActive?: boolean;
}

export class PaginatedTypeSallesDto {
  @ApiProperty({ type: [TypeSalleResponseDto] })
  data: TypeSalleResponseDto[];

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
// Salles
// ============================================

export class CreateSalleDto {
  @ApiProperty({ example: 'AMPHI-A', description: 'Code unique de la salle' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Amphithéâtre A', description: 'Libellé de la salle' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: 'Bâtiment A - 3ème étage', description: 'Site / bâtiment' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  site?: string;

  @ApiProperty({ example: 120, description: 'Capacité maximale (> 0)' })
  @IsInt()
  @Min(1)
  capaciteMax: number;

  @ApiPropertyOptional({ example: 100, description: 'Capacité recommandée (<= capacité maximale)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capaciteRecommandee?: number;

  @ApiPropertyOptional({ example: false, description: 'Accessible aux personnes à mobilité réduite' })
  @IsOptional()
  @IsBoolean()
  accesPMR?: boolean;

  @ApiPropertyOptional({ example: 'Salle équipée d\'un système de sonorisation', description: 'Commentaire' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  commentaire?: string;

  @ApiPropertyOptional({ example: 'uuid-departement', description: 'ID du département (null = salle partagée)' })
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional({ example: 'uuid-type-salle', description: 'ID du type de salle' })
  @IsOptional()
  @IsUUID()
  typeSalleId?: string;

  @ApiPropertyOptional({ example: 'EXT-456', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateSalleDto {
  @ApiPropertyOptional({ example: 'AMPHI-A' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Amphithéâtre A' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: 'Bâtiment A - 3ème étage' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  site?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capaciteMax?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capaciteRecommandee?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  accesPMR?: boolean;

  @ApiPropertyOptional({ example: 'Commentaire' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  commentaire?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional({ example: 'uuid-departement' })
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional({ example: 'uuid-type-salle' })
  @IsOptional()
  @IsUUID()
  typeSalleId?: string;

  @ApiPropertyOptional({ example: 'EXT-456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class SalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiPropertyOptional()
  site?: string;

  @ApiProperty()
  capaciteMax: number;

  @ApiPropertyOptional()
  capaciteRecommandee?: number;

  @ApiProperty()
  accesPMR: boolean;

  @ApiPropertyOptional()
  commentaire?: string;

  @ApiProperty()
  estActive: boolean;

  @ApiPropertyOptional()
  departementId?: string;

  @ApiPropertyOptional()
  typeSalleId?: string;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SalleQueryDto {
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
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  typeSalleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  accesPMR?: boolean;
}

export class PaginatedSallesDto {
  @ApiProperty({ type: [SalleResponseDto] })
  data: SalleResponseDto[];

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
// Équipements
// ============================================

export class CreateEquipementDto {
  @ApiProperty({ example: 'VIDEOPROJ', description: 'Code unique de l\'équipement' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Vidéo projecteur', description: 'Libellé de l\'équipement' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle: string;

  @ApiPropertyOptional({ example: true, description: 'L\'équipement est actif' })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional({ example: 'EXT-789', description: 'ID d\'origine externe (synchronisation)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class UpdateEquipementDto {
  @ApiPropertyOptional({ example: 'VIDEOPROJ' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Vidéo projecteur' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  libelle?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;

  @ApiPropertyOptional({ example: 'EXT-789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  originId?: string;
}

export class EquipementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  estActive: boolean;

  @ApiPropertyOptional()
  originId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EquipementQueryDto {
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
  @IsBoolean()
  estActive?: boolean;
}

export class PaginatedEquipementsDto {
  @ApiProperty({ type: [EquipementResponseDto] })
  data: EquipementResponseDto[];

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
// Affectation d'équipements à une salle
// ============================================

export class AssignerEquipementsDto {
  @ApiProperty({ type: [String], description: 'IDs des équipements à affecter à la salle' })
  @IsUUID('4', { each: true })
  equipementIds: string[];
}