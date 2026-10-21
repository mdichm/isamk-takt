import { IsString, IsOptional, IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type AffectationStatut = 'PROPOSEE' | 'VALIDEE' | 'REFUSEE';

export const AffectationStatut = {
  PROPOSEE: 'PROPOSEE' as const,
  VALIDEE: 'VALIDEE' as const,
  REFUSEE: 'REFUSEE' as const,
} as const;

export class CreateAffectationDto {
  @ApiProperty({ description: 'ID de l\'enseignant (UUID)' })
  @IsUUID()
  enseignantId: string;

  @ApiPropertyOptional({ description: 'ID du groupe (UUID)' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiProperty({ description: 'ID du module (UUID)' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: "ID du type d'enseignement (UUID)" })
  @IsUUID()
  typeEnseignementId: string;

  @ApiPropertyOptional({ description: 'ID du tag d\'activité (UUID)' })
  @IsOptional()
  @IsUUID()
  activityTagId?: string;

  @ApiProperty({ description: 'Nombre de séances par semaine', minimum: 1 })
  @IsInt()
  @Min(1)
  seancesParSemaine: number;

  @ApiProperty({ description: 'Durée en minutes (multiple de 30)', minimum: 30 })
  @IsInt()
  @Min(30)
  dureeMinutes: number;

  @ApiPropertyOptional({ default: false, description: 'CM commun' })
  @IsOptional()
  @IsBoolean()
  estCmCommun?: boolean;
}

export class UpdateAffectationDto {
  @ApiPropertyOptional({ description: 'ID de l\'enseignant (UUID)' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'ID du groupe (UUID)' })
  @IsOptional()
  @IsUUID()
  groupeId?: string;

  @ApiPropertyOptional({ description: 'ID du module (UUID)' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ description: "ID du type d'enseignement (UUID)" })
  @IsOptional()
  @IsUUID()
  typeEnseignementId?: string;

  @ApiPropertyOptional({ description: 'ID du tag d\'activité (UUID)' })
  @IsOptional()
  @IsUUID()
  activityTagId?: string;

  @ApiPropertyOptional({ description: 'Nombre de séances par semaine', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seancesParSemaine?: number;

  @ApiPropertyOptional({ description: 'Durée en minutes (multiple de 30)', minimum: 30 })
  @IsOptional()
  @IsInt()
  @Min(30)
  dureeMinutes?: number;

  @ApiPropertyOptional({ description: 'CM commun' })
  @IsOptional()
  @IsBoolean()
  estCmCommun?: boolean;
}

export class AffectationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  repartitionId: string;

  @ApiProperty()
  enseignantId: string;

  @ApiPropertyOptional()
  groupeId?: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  typeEnseignementId: string;

  @ApiPropertyOptional()
  activityTagId?: string;

  @ApiProperty()
  volumeHebdoMinutes: number;

  @ApiProperty()
  seancesParSemaine: number;

  @ApiProperty()
  dureeMinutes: number;

  @ApiProperty({ default: false })
  estCmCommun: boolean;

  @ApiProperty({ default: 1 })
  workingRevision: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedAffectationsDto {
  @ApiProperty({ type: [AffectationResponseDto] })
  data: AffectationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AffectationQueryDto {
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
  enseignantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupeId?: string;
}
