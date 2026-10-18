// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs du domaine compatibilité (salle/tag, exigences d'équipement) — L1-11

import { IsOptional, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ExigenceNiveau } from '@takt/db';

// ============================================
// Salle / Activity Tag (compatibilité tag d'une salle)
// ============================================

export class CreateSalleActivityTagDto {
  @ApiProperty({ description: 'ID de la salle concernée' })
  @IsUUID('4')
  salleId: string;

  @ApiProperty({ description: 'ID de l\'Activity Tag autorisé sur cette salle' })
  @IsUUID('4')
  activityTagId: string;
}

export class SalleActivityTagResponseDto {
  @ApiProperty({ description: 'ID de la salle' })
  salleId: string;

  @ApiProperty({ description: 'ID de l\'Activity Tag autorisé' })
  activityTagId: string;
}

export class SalleActivityTagQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtrer par salle' })
  @IsOptional()
  @IsUUID('4')
  salleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par Activity Tag' })
  @IsOptional()
  @IsUUID('4')
  activityTagId?: string;
}

export class PaginatedSalleActivityTagsDto {
  @ApiProperty({ type: [SalleActivityTagResponseDto] })
  data: SalleActivityTagResponseDto[];

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
// Exigences d'équipement par (module, type d'enseignement)
// ============================================

export class CreateExigenceEquipementDto {
  @ApiProperty({ description: 'ID du module concerné' })
  @IsUUID('4')
  moduleId: string;

  @ApiProperty({ description: 'ID du type d\'enseignement concerné' })
  @IsUUID('4')
  typeEnseignementId: string;

  @ApiProperty({ description: 'ID de l\'équipement requis' })
  @IsUUID('4')
  equipementId: string;

  @ApiPropertyOptional({ enum: ExigenceNiveau, default: ExigenceNiveau.OBLIGATOIRE, description: 'Niveau d\'exigence de l\'équipement' })
  @IsOptional()
  @IsEnum(ExigenceNiveau)
  niveau?: ExigenceNiveau;
}

export class UpdateExigenceEquipementDto {
  @ApiPropertyOptional({ enum: ExigenceNiveau, description: 'Nouveau niveau d\'exigence' })
  @IsOptional()
  @IsEnum(ExigenceNiveau)
  niveau?: ExigenceNiveau;
}

export class ExigenceEquipementResponseDto {
  @ApiProperty({ description: 'ID du module' })
  moduleId: string;

  @ApiProperty({ description: 'ID du type d\'enseignement' })
  typeEnseignementId: string;

  @ApiProperty({ description: 'ID de l\'équipement requis' })
  equipementId: string;

  @ApiProperty({ enum: ExigenceNiveau, description: 'Niveau d\'exigence' })
  niveau: ExigenceNiveau;
}

export class ExigenceEquipementIdQueryDto {
  @ApiProperty({ description: 'ID du module' })
  @IsUUID('4')
  moduleId: string;

  @ApiProperty({ description: 'ID du type d\'enseignement' })
  @IsUUID('4')
  typeEnseignementId: string;

  @ApiProperty({ description: 'ID de l\'équipement' })
  @IsUUID('4')
  equipementId: string;
}

export class ExigenceEquipementQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtrer par module' })
  @IsOptional()
  @IsUUID('4')
  moduleId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type d\'enseignement' })
  @IsOptional()
  @IsUUID('4')
  typeEnseignementId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par équipement' })
  @IsOptional()
  @IsUUID('4')
  equipementId?: string;

  @ApiPropertyOptional({ enum: ExigenceNiveau, description: 'Filtrer par niveau' })
  @IsOptional()
  @IsEnum(ExigenceNiveau)
  niveau?: ExigenceNiveau;
}

export class PaginatedExigencesEquipementDto {
  @ApiProperty({ type: [ExigenceEquipementResponseDto] })
  data: ExigenceEquipementResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
