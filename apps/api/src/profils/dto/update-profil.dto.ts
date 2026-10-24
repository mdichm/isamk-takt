// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de modification de profil de génération (L4-10)
import { IsString, IsInt, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfilDto {
  @ApiPropertyOptional({ example: 'Standard S1 v2', description: 'Nom lisible du profil' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Durée maximale de génération en minutes',
  })
  @IsOptional()
  @IsInt()
  dureeLimiteMinutes?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Préserver les verrous existants durant la génération',
  })
  @IsOptional()
  @IsBoolean()
  preserverVerrous?: boolean;

  @ApiPropertyOptional({ example: '7.12.0', description: 'Version du moteur FET' })
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