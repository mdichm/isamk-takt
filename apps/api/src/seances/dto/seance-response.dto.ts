// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTO de réponse de séance (L3-11)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, IsEnum, IsString, IsNumber } from 'class-validator';
import { SeanceStatut, SeanceOrigine, JourSemaine } from '@takt/db';
import { OccupationResponseDto } from './occupation-response.dto.js';

// ============================================
// Seance (L3-11)
// ============================================

export class SeanceResponseDto {
  @ApiProperty({ description: 'ID de la séance' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'ID de la version' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'ID du semestre' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ description: 'Clé d’affectation (groupe:module:type:enseignant)' })
  @IsString()
  affectationKey: string;

  @ApiProperty({ description: 'Index de la séance dans l’affectation', default: 1 })
  @IsInt()
  rang: number;

  @ApiPropertyOptional({ description: 'Tag résolu du snapshot' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ enum: SeanceStatut, description: 'Statut de placement' })
  @IsEnum(SeanceStatut)
  statut: SeanceStatut;

  @ApiProperty({ enum: SeanceOrigine, description: 'Origine de la séance' })
  @IsEnum(SeanceOrigine)
  origine: SeanceOrigine;

  @ApiProperty({ description: 'Numéro de révision' })
  @IsInt()
  revision: number;

  @ApiPropertyOptional({ enum: JourSemaine, description: 'Jour de placement' })
  @IsOptional()
  @IsEnum(JourSemaine)
  jour?: JourSemaine;

  @ApiPropertyOptional({ description: 'ID du créneau de début' })
  @IsOptional()
  @IsUUID()
  creneauDebutId?: string;

  @ApiProperty({ description: 'Nombre de créneaux', default: 1 })
  @IsInt()
  nbCreneaux: number;

  @ApiPropertyOptional({ description: 'ID de l’enseignant assigné' })
  @IsOptional()
  @IsUUID()
  enseignantId?: string;

  @ApiPropertyOptional({ description: 'ID de la salle assignée' })
  @IsOptional()
  @IsUUID()
  salleId?: string;

  @ApiProperty({ description: 'IDs des groupes concernés', type: [String] })
  groupes: string[];

  @ApiPropertyOptional({ description: 'Occupations (placements) de la séance', type: () => [OccupationResponseDto] })
  @IsOptional()
  occupations?: OccupationResponseDto[];

  @ApiPropertyOptional({
    description: 'Score de contraintes souples (0-100) après le déplacement, null si aucune contrainte souple évaluable',
    example: 78.5,
  })
  @IsOptional()
  @IsNumber()
  softScore?: number | null;

  @ApiPropertyOptional({
    description: 'Delta de score souple (nouveau - ancien) après le déplacement, null si non évaluable',
    example: 12.5,
  })
  @IsOptional()
  @IsNumber()
  softDelta?: number | null;
}

export const toSeanceDto = (
  entity: any,
  includeOccupations = false,
  softScore?: number | null,
  softDelta?: number | null,
): SeanceResponseDto => {
  const dto: SeanceResponseDto = {
    id: entity.id,
    versionId: entity.versionId,
    semestreId: entity.semestreId,
    affectationKey: entity.affectationKey,
    rang: entity.rang,
    tag: entity.tag ?? undefined,
    statut: entity.statut,
    origine: entity.origine,
    revision: entity.revision,
    jour: entity.jour ?? undefined,
    creneauDebutId: entity.creneauDebutId ?? undefined,
    nbCreneaux: entity.nbCreneaux,
    enseignantId: entity.enseignantId ?? undefined,
    salleId: entity.salleId ?? undefined,
    groupes: (entity.seanceGroupes ?? []).map((sg: any) => sg.groupeId),
    softScore: softScore ?? undefined,
    softDelta: softDelta ?? undefined,
  };

  if (includeOccupations && entity.occupations) {
    dto.occupations = entity.occupations.map((o: any) => ({
      id: o.id,
      versionId: o.versionId,
      seanceId: o.seanceId,
      jour: o.jour,
      creneauId: o.creneauId,
      ressourceType: o.ressourceType,
      ressourceId: o.ressourceId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  return dto;
};
