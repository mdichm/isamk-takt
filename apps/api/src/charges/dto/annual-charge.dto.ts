// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - DTOs API vue annuelle des charges (L2-17)
// Implémente GET /charges/annuelles conformément à ST §4.2 et EX-CHG-04.

import { ApiProperty } from '@nestjs/swagger';
import { ChargeEnseignantDetail } from './charge.dto.js';

export type ChargeSource = 'SNAPSHOT_VALIDE' | 'COPIE_TRAVAIL' | 'ABSENT';

export class SemestreChargeDto {
  @ApiProperty({
    description: 'Charge calculée pour ce semestre en heures',
  })
  chargeCalculee: number;

  @ApiProperty({
    enum: ['SNAPSHOT_VALIDE', 'COPIE_TRAVAIL', 'ABSENT'],
    description:
      'Source de la donnée pour ce semestre : SNAPSHOT_VALIDE (répartition validée), COPIE_TRAVAIL (brouillon/rouverte), ABSENT (aucune répartition)',
  })
  source: ChargeSource;

  @ApiProperty({
    description:
      'Indique si le calcul est partiel (semestre sans répartition validée)',
  })
  calculPartiel: boolean;
}

export class ChargeTotaleAnnuelleDto {
  @ApiProperty({
    description: 'Volume brut en heures (S1 + S2)',
  })
  volumeBrut: number;

  @ApiProperty({
    description: 'Charge pondérée en heures (S1 + S2)',
  })
  chargeCalculee: number;

  @ApiProperty({
    description: 'Charge de référence du grade en heures',
  })
  chargeReference: number;

  @ApiProperty({
    description: 'Décharges en heures (S1 + S2)',
  })
  decharges: number;

  @ApiProperty({
    description: 'Service dû en heures',
  })
  serviceDu: number;

  @ApiProperty({
    description: 'Écart = charge pondérée − service dû',
  })
  ecart: number;

  @ApiProperty({
    description: 'Heures supplémentaires sur le cumul annuel',
  })
  heuresSup: number;

  @ApiProperty({
    description: 'Dépassement du plafond',
  })
  depassePlafond: boolean;
}

export class AnnualChargeEnseignantDto {
  @ApiProperty({
    description: 'ID de l’enseignant',
  })
  enseignantId: string;

  @ApiProperty({
    description: 'Matricule',
  })
  matricule: string;

  @ApiProperty({
    description: 'Nom',
  })
  nom: string;

  @ApiProperty({
    description: 'Prénom',
  })
  prenom: string;

  @ApiProperty({
    description: 'ID du département',
  })
  departementId: string;

  @ApiProperty({
    description: 'Libellé du département',
  })
  departementLibelle: string;

  @ApiProperty({
    type: SemestreChargeDto,
    description: 'Charge du semestre 1',
  })
  s1: SemestreChargeDto;

  @ApiProperty({
    type: SemestreChargeDto,
    description: 'Charge du semestre 2',
  })
  s2: SemestreChargeDto;

  @ApiProperty({
    type: ChargeTotaleAnnuelleDto,
    description: 'Charge totale annuelle (S1 + S2)',
  })
  total: ChargeTotaleAnnuelleDto;

  @ApiProperty({
    description:
      'Indicateur de divergence (un semestre a été rouvert après validation)',
  })
  divergence: boolean;

  @ApiProperty({
    type: [ChargeEnseignantDetail],
    description: 'Détail par activité (cumulé S1 + S2)',
  })
  detail: ChargeEnseignantDetail[];
}

export class AnnualChargesDto {
  @ApiProperty({
    type: [AnnualChargeEnseignantDto],
    description: 'Charges annuelles par enseignant',
  })
  data: AnnualChargeEnseignantDto[];

  @ApiProperty({
    description: 'Nombre total d’éléments',
  })
  total: number;
}