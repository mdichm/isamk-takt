// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de profil de génération (L4-10)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfilResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty({ example: 'Standard S1', description: 'Nom lisible du profil' })
  nom: string;

  @ApiProperty({ example: 1, description: 'Numéro de version du profil' })
  numero: number;

  @ApiProperty({ example: false, description: 'Est le profil par défaut du semestre' })
  estParDefaut: boolean;

  @ApiProperty({ example: 120, description: 'Durée maximale de génération en minutes' })
  dureeLimiteMinutes: number;

  @ApiProperty({ example: false, description: 'Préserver les verrous existants' })
  preserverVerrous: boolean;

  @ApiPropertyOptional({ example: '7.12.0', description: 'Version du moteur FET' })
  engineVersion?: string;

  @ApiPropertyOptional({ example: '1.0.0', description: 'Version du constructeur de fichier moteur' })
  constructeurVersion?: string;

  @ApiProperty({ example: [10, 11, 12, 20, 21, 22], description: 'Graines aléatoires' })
  graines: unknown[];

  @ApiProperty({ example: { remplissage: 40, compactage: 30 }, description: 'Poids par critère de score' })
  poidsScore: Record<string, unknown>;

  @ApiProperty({ description: 'Copie figée des valeurs du profil' })
  valeursSnapshot: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}