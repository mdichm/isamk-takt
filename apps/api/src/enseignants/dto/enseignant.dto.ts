import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Enseignants (L1-07)
// ============================================

export class CreateEnseignantDto {
  @ApiProperty({ example: 'E12345', description: 'Matricule de l’enseignant' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  matricule: string;

  @ApiProperty({ example: 'Dupont', description: 'Nom de l’enseignant' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom de l’enseignant' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ example: 'jean.dupont@univ.fr', description: 'Email institutionnel' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+33123456789', description: 'Téléphone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiProperty({ description: "ID de l’année universitaire" })
  @IsUUID()
  anneeId: string;

  @ApiProperty({ description: 'ID du département' })
  @IsUUID()
  departementId: string;

  @ApiPropertyOptional({ description: "ID du grade (optionnel)" })
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'IDs des modules enseignables', type: [String] })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  moduleIds?: string[];
}

export class UpdateEnseignantDto {
  @ApiPropertyOptional({ example: 'E12345' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  matricule?: string;

  @ApiPropertyOptional({ example: 'Dupont' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nom?: string;

  @ApiPropertyOptional({ example: 'Jean' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  prenom?: string;

  @ApiPropertyOptional({ example: 'jean.dupont@univ.fr' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+33123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "ID de l’année universitaire" })
  @IsOptional()
  @IsUUID()
  anneeId?: string;

  @ApiPropertyOptional({ description: 'ID du département' })
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional({ description: "ID du grade (null pour supprimer)" })
  @IsOptional()
  @IsUUID()
  gradeId?: string | null;
}

export class EnseignantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matricule: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  prenom: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  telephone: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  anneeId: string;

  @ApiProperty()
  departementId: string;

  @ApiPropertyOptional()
  gradeId: string | null;

  @ApiProperty({ type: [String], description: 'IDs des modules enseignables' })
  moduleIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedEnseignantsDto {
  @ApiProperty({ type: [EnseignantResponseDto] })
  data: EnseignantResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class EnseignantsQueryDto {
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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  anneeId?: string;
}

export class AssignModulesDto {
  @ApiProperty({ description: 'IDs des modules à assigner', type: [String] })
  @IsUUID(undefined, { each: true })
  moduleIds: string[];
}
