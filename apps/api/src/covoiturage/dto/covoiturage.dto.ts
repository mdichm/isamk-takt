// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs des groupes de covoiturage (L3-41)
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Groupes de covoiturage (L3-41)
// ============================================

export class CreateCovoiturageDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({
    example: ['uuid-ens-1', 'uuid-ens-2'],
    description: "IDs des enseignants du groupe (minimum 2)",
  })
  @IsArray()
  @MinLength(2)
  @IsUUID(undefined, { each: true })
  enseignantIds: string[];

  @ApiPropertyOptional({
    example: 60,
    default: 60,
    description: "Marge horaire en minutes entre les seances des membres",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  margeMinutes?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: "Nombre minimum de jours communs de presence",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  joursCommunsMin?: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'Mode strict (conflit bloquant si viole)' })
  @IsOptional()
  @IsBoolean()
  strict?: boolean;
}

export class UpdateCovoiturageDto {
  @ApiPropertyOptional({ example: ['uuid-ens-1', 'uuid-ens-2'] })
  @IsOptional()
  @IsArray()
  @MinLength(2)
  @IsUUID(undefined, { each: true })
  enseignantIds?: string[];

  @ApiPropertyOptional({ example: 60, description: 'Marge horaire en minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  margeMinutes?: number;

  @ApiPropertyOptional({ example: 1, description: 'Nombre minimum de jours communs' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  joursCommunsMin?: number;

  @ApiPropertyOptional({ example: true, description: 'Mode strict' })
  @IsOptional()
  @IsBoolean()
  strict?: boolean;
}

export class CovoiturageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ type: [String] })
  enseignantIds: string[];

  @ApiProperty()
  margeMinutes: number;

  @ApiProperty()
  joursCommunsMin: number;

  @ApiProperty()
  strict: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class CovoiturageQueryDto {
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
  semestreId?: string;
}
