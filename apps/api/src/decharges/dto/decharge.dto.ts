import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Décharges enseignant (L1-08)
// ============================================

export class CreateDechargeDto {
  @ApiProperty({ example: 12.5, description: 'Heures équivalentes de décharge' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  heures: number;

  @ApiProperty({ description: 'ID de l’enseignant' })
  @IsUUID()
  enseignantId: string;

  @ApiProperty({ description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;
}

export class UpdateDechargeDto {
  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  heures?: number;

  @ApiPropertyOptional({ description: 'ID de l’enseignant' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'ID du semestre' })
  @IsOptional()
  @IsUUID()
  semestreId?: string;
}

export class DechargeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  heures: number;

  @ApiProperty()
  enseignantId: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedDechargesDto {
  @ApiProperty({ type: [DechargeResponseDto] })
  data: DechargeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class DechargesQueryDto {
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
  semestreId?: string;
}