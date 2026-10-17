import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Types d'enseignement
// ============================================

export type TypeEnseignementCode = 'CM' | 'TD' | 'TP' | 'CI' | 'AUTRE';

export const TypeEnseignementCode = {
  CM: 'CM' as TypeEnseignementCode,
  TD: 'TD' as TypeEnseignementCode,
  TP: 'TP' as TypeEnseignementCode,
  CI: 'CI' as TypeEnseignementCode,
  AUTRE: 'AUTRE' as TypeEnseignementCode,
} as const;

const TypeEnseignementValues = ['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const;

export class CreateTypeEnseignementDto {
  @ApiProperty({ enum: TypeEnseignementValues, description: 'Code du type d\'enseignement' })
  @IsIn(TypeEnseignementValues)
  code: TypeEnseignementCode;

  @ApiProperty({ example: 'Cours magistral', description: 'Libellé du type d\'enseignement' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  libelle: string;
}

export class UpdateTypeEnseignementDto {
  @ApiPropertyOptional({ example: 'TD' })
  @IsOptional()
  @IsIn(TypeEnseignementValues)
  code?: TypeEnseignementCode;

  @ApiPropertyOptional({ example: 'Travaux dirigés' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  libelle?: string;
}

export class TypeEnseignementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TypeEnseignementValues })
  code: TypeEnseignementCode;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// Grades
// ============================================

export type GradeCode = 'MC' | 'MCF' | 'PR' | 'ATER' | 'AUTRE';

export const GradeCode = {
  MC: 'MC' as GradeCode,
  MCF: 'MCF' as GradeCode,
  PR: 'PR' as GradeCode,
  ATER: 'ATER' as GradeCode,
  AUTRE: 'AUTRE' as GradeCode,
} as const;

const GradeValues = ['MC', 'MCF', 'PR', 'ATER', 'AUTRE'] as const;

export class CreateGradeDto {
  @ApiProperty({ enum: GradeValues, description: 'Code du grade' })
  @IsIn(GradeValues)
  code: GradeCode;

  @ApiProperty({ example: 'Maître de conférences', description: 'Libellé du grade' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  libelle: string;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ example: 'PR' })
  @IsOptional()
  @IsIn(GradeValues)
  code?: GradeCode;

  @ApiPropertyOptional({ example: 'Professeur des universités' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  libelle?: string;
}

export class GradeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: GradeValues })
  code: GradeCode;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}


// ============================================
// Modules
// ============================================

export class CreateModuleDto {
  @ApiProperty({ description: 'ID du niveau parent' })
  @IsUUID()
  niveauId: string;

  @ApiProperty({ description: 'ID du type d\'enseignement' })
  @IsUUID()
  typeId: string;

  @ApiPropertyOptional({ description: 'ID du grade (optionnel)' })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiProperty({ example: 'INFO301', description: 'Code du module' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Algorithmique avancée', description: 'Libellé du module' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  libelle: string;

  @ApiProperty({ example: 1, description: 'Numéro du semestre (1 ou 2)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  semestreNumero: number;

  @ApiPropertyOptional({ default: 6, description: 'Crédits ECTS' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  credits?: number;

  @ApiPropertyOptional({ description: 'Effectif maximum du module' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  effectifMax?: number;
}

export class UpdateModuleDto {
  @ApiPropertyOptional({ example: 'INFO302' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ example: 'Structures de données' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  libelle?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  semestreNumero?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  credits?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  effectifMax?: number;

  @ApiPropertyOptional({ description: 'ID du nouveau type d\'enseignement' })
  @IsOptional()
  @IsUUID()
  typeId?: string;

  @ApiPropertyOptional({ description: 'ID du nouveau niveau parent' })
  @IsOptional()
  @IsUUID()
  niveauId?: string;

  @ApiPropertyOptional({ description: 'ID du nouveau grade (null pour supprimer)' })
  @IsOptional()
  @IsUUID()
  gradeId?: string | null;
}

export class ModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  niveauId: string;

  @ApiProperty()
  typeId: string;

  @ApiPropertyOptional()
  gradeId: string | null;

  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  semestreNumero: number;

  @ApiProperty()
  credits: number;

  @ApiPropertyOptional()
  effectifMax: number | null;

  @ApiPropertyOptional()
  originId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedModulesDto {
  @ApiProperty({ type: [ModuleResponseDto] })
  data: ModuleResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ModulesQueryDto {
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

  @ApiPropertyOptional({ enum: TypeEnseignementValues })
  @IsOptional()
  @IsIn(TypeEnseignementValues)
  typeCode?: string;

  @ApiPropertyOptional({ enum: GradeValues })
  @IsOptional()
  @IsIn(GradeValues)
  gradeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  niveauId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  semestreNumero?: number;
}