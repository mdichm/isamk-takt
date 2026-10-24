// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de création de profil de génération (L4-10)
import { IsString, IsInt, IsBoolean, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfilDto {
  @ApiProperty({ example: 'uuid-semestre', description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'Standard S1', description: 'Nom lisible du profil' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Durée maximale de génération en minutes',
  })
  @IsOptional()
  @IsInt()
  dureeLimiteMinutes?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Préserver les verrous existants durant la génération',
  })
  @IsOptional()
  @IsBoolean()
  preserverVerrous?: boolean;

  @ApiPropertyOptional({
    example: '7.12.0',
    description: 'Version du moteur FET',
  })
  @IsOptional()
  @IsString()
  engineVersion?: string;

  @ApiPropertyOptional({
    example: '1.0.0',
    description: 'Version du constructeur de fichier moteur',
  })
  @IsOptional()
  @IsString()
  constructeurVersion?: string;

  @ApiPropertyOptional({
    example: [10, 11, 12, 20, 21, 22],
    description: 'Tableau des graines aléatoires',
  })
  @IsOptional()
  @IsArray()
  graines?: number[];

  @ApiPropertyOptional({
    example: { remplissage: 40, compactage: 30, creneaux: 20, caved: 10 },
    description: 'Poids par critère de score (0-100)',
  })
  @IsOptional()
  poidsScore?: Record<string, number>;
}