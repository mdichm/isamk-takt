import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsJSON,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type DemandeType = 'ANOMALIE' | 'MODIFICATION';
export type DemandeStatut = 'OUVERTE' | 'TRAITEE' | 'REFUSEE';

export const DemandeType = {
  ANOMALIE: 'ANOMALIE' as const,
  MODIFICATION: 'MODIFICATION' as const,
} as const;

export const DemandeStatut = {
  OUVERTE: 'OUVERTE' as const,
  TRAITEE: 'TRAITEE' as const,
  REFUSEE: 'REFUSEE' as const,
} as const;

// ============================================
// Demandes de modification (L2-15)
// ============================================

export class CreateDemandeDto {
  @ApiProperty({ description: 'ID du semestre (UUID)' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'Code du département (ex: INFO, MATH)' })
  @IsString()
  @IsNotEmpty()
  departementCode: string;

  @ApiPropertyOptional({ description: 'ID de la version ciblée (UUID)' })
  @IsOptional()
  @IsUUID()
  versionId?: string;

  @ApiProperty({ enum: ['ANOMALIE', 'MODIFICATION'] })
  @IsIn(['ANOMALIE', 'MODIFICATION'])
  type: DemandeType;

  @ApiProperty({ description: 'Cible de la demande (JSON)' })
  @IsJSON()
  cible: unknown;

  @ApiProperty({ description: 'Motif de la demande' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  motif: string;
}

export class TraiterDemandeDto {
  @ApiProperty({ enum: ['TRAITEE', 'REFUSEE'] })
  @IsIn(['TRAITEE', 'REFUSEE'])
  statut: DemandeStatut;

  @ApiPropertyOptional({ description: 'Réponse de l\'autorité compétente' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reponse?: string;
}

export class DemandeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  departementCode: string;

  @ApiProperty()
  auteurId: string;

  @ApiPropertyOptional()
  versionId?: string | null;

  @ApiProperty({ enum: ['ANOMALIE', 'MODIFICATION'] })
  type: DemandeType;

  @ApiProperty()
  cible: unknown;

  @ApiProperty()
  motif: string;

  @ApiProperty({ enum: ['OUVERTE', 'TRAITEE', 'REFUSEE'] })
  statut: DemandeStatut;

  @ApiPropertyOptional()
  reponse?: string | null;

  @ApiPropertyOptional()
  traiteePar?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  traiteeLe?: Date | null;
}

export class PaginatedDemandesDto {
  @ApiProperty({ type: [DemandeResponseDto] })
  data: DemandeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class DemandeQueryDto {
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

  @ApiPropertyOptional({ enum: ['ANOMALIE', 'MODIFICATION'] })
  @IsOptional()
  @IsIn(['ANOMALIE', 'MODIFICATION'])
  type?: DemandeType;

  @ApiPropertyOptional({ enum: ['OUVERTE', 'TRAITEE', 'REFUSEE'] })
  @IsOptional()
  @IsIn(['OUVERTE', 'TRAITEE', 'REFUSEE'])
  statut?: DemandeStatut;

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
  @IsString()
  departementCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  auteurId?: string;
}

export const toDemandeDto = (entity: any): DemandeResponseDto => ({
  id: entity.id,
  semestreId: entity.semestreId,
  departementCode: entity.departementCode,
  auteurId: entity.auteurId,
  versionId: entity.versionId ?? undefined,
  type: entity.type,
  cible: entity.cible,
  motif: entity.motif,
  statut: entity.statut,
  reponse: entity.reponse ?? undefined,
  traiteePar: entity.traiteePar ?? undefined,
  createdAt: entity.createdAt,
  traiteeLe: entity.traiteeLe ?? undefined,
});