import { IsString, IsOptional, MinLength, MaxLength, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'frontend' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: '#6366f1', description: 'Couleur hexadécimale' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'frontend' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class TagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  createdAt: Date;
}