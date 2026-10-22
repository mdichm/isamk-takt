// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de simulation de placement (L3-21)
// Lecture seule : aucune écriture en base
import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConflitType, ConflitSeverite, JourSemaine } from '@takt/db';

export class SimulatePlacementDto {
  @ApiProperty({ enum: JourSemaine, description: 'Jour cible du placement' })
  @IsEnum(JourSemaine)
  jour: JourSemaine;

  @ApiProperty({
    example: 'uuid-creneau',
    description: "ID du créneau de début cible",
  })
  @IsUUID()
  creneauDebutId: string;

  @ApiProperty({
    example: 'uuid-salle',
    description: 'ID de la salle cible',
  })
  @IsUUID()
  salleId: string;
}

export class ConflitSimuleDto {
  @ApiProperty()
  regleCode: string;

  @ApiProperty({ enum: ConflitType })
  type: ConflitType;

  @ApiProperty({ enum: ConflitSeverite })
  severite: ConflitSeverite;

  @ApiProperty()
  message: string;

  @ApiProperty()
  signature: string;
}

export class ImpactSimuleDto {
  @ApiProperty({ type: [String] })
  groupes: string[];

  @ApiProperty()
  enseignant: string;

  @ApiProperty()
  salle: string;

  @ApiProperty({ type: [String] })
  verrous: string[];
}

export class SimulatePlacementResponseDto {
  @ApiProperty({ type: [ConflitSimuleDto] })
  conflits: ConflitSimuleDto[];

  @ApiProperty({ type: [ConflitSimuleDto] })
  conflitsBloquants: ConflitSimuleDto[];

  @ApiProperty({ type: [ConflitSimuleDto] })
  conflitsAvertissements: ConflitSimuleDto[];

  @ApiProperty()
  placementValide: boolean;

  @ApiProperty()
  impacts: ImpactSimuleDto;

  @ApiProperty()
  dureeMs: number;
}
