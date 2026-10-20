import { describe, it, expect } from 'vitest';
import {
  calculerCharge,
  ConfigurationError,
  type ChargeRuleSetInput,
  type EnseignantChargeInput,
  type SemestreData,
  type AnneeData,
} from './index.js';

describe('calculerCharge — moteur de calcul de la charge (ST §4.2)', () => {
  const ruleSet: ChargeRuleSetInput = {
    numero: 1,
    periode: 'HEBDOMADAIRE',
    arrondiDecimales: 2,
    coefficients: [
      { type: 'CM', grade: 'MCF', value: 1.0 },
      { type: 'CM', grade: 'PR', value: 1.2 },
      { type: 'TD', grade: undefined, value: 0.75 },
      { type: 'TP', grade: 'MCF', value: 0.5 },
      { type: 'TP', grade: 'PR', value: 0.6 },
    ],
    chargeReference: [
      { grade: 'MCF', value: 192 },
      { grade: 'PR', value: 160 },
    ],
    seuilHeuresSup: 0,
  };

  const enseignantMCF: EnseignantChargeInput = {
    id: 'ens-1',
    grade: 'MCF',
    decharges: [],
  };

  const semestre15: SemestreData = {
    nbSemaines: 15,
    affectations: [
      { id: 'a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 120 },
      { id: 'a2', module: 'Math', type: 'TD', volumeHebdoMinutes: 90 },
    ],
  };

  // ---- Cas de base HEBDOMADAIRE ----
  it('calcule la charge hebdomadaire brute et pondérée (HEBDOMADAIRE)', () => {
    const result = calculerCharge(enseignantMCF, ruleSet, semestre15);

    expect(result.volumeBrut).toBe(3.5);
    expect(result.chargeCalculee).toBe(3.13); // 3.125 arrondi à 2 décimales
    expect(result.chargeReference).toBe(192);
    expect(result.serviceDu).toBe(192);
    expect(result.ecart).toBe(3.13 - 192);
    expect(result.heuresSup).toBe(0);
    expect(result.depassePlafond).toBe(false);
    expect(result.periode).toBe('HEBDOMADAIRE');
  });

  // ---- Coefficient par grade prime sur général ----
  it('utilise le coefficient spécifique au grade quand il existe', () => {
    const result = calculerCharge(enseignantMCF, ruleSet, semestre15);
    const cmDetail = result.detail.find(d => d.type === 'CM');
    expect(cmDetail?.coefficient).toBe(1.0);
  });

  it('utilise le coefficient général du type quand aucun grade spécifique', () => {
    const result = calculerCharge(enseignantMCF, ruleSet, semestre15);
    const tdDetail = result.detail.find(d => d.type === 'TD');
    expect(tdDetail?.coefficient).toBe(0.75);
  });

  // ---- ConfigurationError: coefficient manquant ----
  it('lève ConfigurationError quand le coefficient est manquant pour un type/grade', () => {
    const ruleSetSansCoef: ChargeRuleSetInput = {
      ...ruleSet,
      coefficients: [
        { type: 'CM', grade: 'MCF', value: 1.0 },
      ],
      chargeReference: [{ grade: 'MCF', value: 192 }],
    };
    expect(() =>
      calculerCharge(enseignantMCF, ruleSetSansCoef, {
        ...semestre15,
        affectations: [{ id: 'a1', module: 'Math', type: 'TD', volumeHebdoMinutes: 90 }],
      })
    ).toThrow(ConfigurationError);
  });

  // ---- ConfigurationError: charge de référence manquante ----
  it('lève ConfigurationError quand la charge de référence est manquante pour le grade', () => {
    const ruleSetSansRef: ChargeRuleSetInput = {
      ...ruleSet,
      chargeReference: [{ grade: 'PR', value: 160 }],
    };
    expect(() => calculerCharge(enseignantMCF, ruleSetSansRef, semestre15)).toThrow(
      ConfigurationError
    );
  });

  // ---- CM commun : déduplication ----
  it('un CM commun compte une seule fois pour l\'enseignant (test dédié)', () => {
    const semestreCM: SemestreData = {
      nbSemaines: 15,
      affectations: [
        { id: 'a1', groupeCommunKey: 'gc-1', module: 'Math', type: 'CM', volumeHebdoMinutes: 120 },
        { id: 'a2', groupeCommunKey: 'gc-1', module: 'Math', type: 'CM', volumeHebdoMinutes: 120 },
        { id: 'a3', module: 'Physique', type: 'CM', volumeHebdoMinutes: 60 },
      ],
    };
    const result = calculerCharge(enseignantMCF, ruleSet, semestreCM);

    expect(result.volumeBrut).toBe(3);
    expect(result.chargeCalculee).toBe(3 * 1.0);
    const cmDetails = result.detail.filter(d => d.type === 'CM');
    expect(cmDetails).toHaveLength(2);
    const gcDetail = cmDetails.find(d => d.groupeCommunKey === 'gc-1');
    expect(gcDetail?.volume).toBe(2);
  });

  // ---- Période SEMESTRIELLE ----
  it('multiplie par nbSemaines en mode SEMESTRIELLE', () => {
    const ruleSetSem: ChargeRuleSetInput = { ...ruleSet, periode: 'SEMESTRIELLE' };
    const result = calculerCharge(enseignantMCF, ruleSetSem, semestre15);

    expect(result.volumeBrut).toBe(3.5 * 15);
    expect(result.chargeCalculee).toBe(46.88); // 46.875 arrondi à 2 décimales
  });

  // ---- Période ANNUELLE ----
  it('somme sur les semestres en mode ANNUELLE', () => {
    const ruleSetAnnuelle: ChargeRuleSetInput = { ...ruleSet, periode: 'ANNUELLE' };
    const annee: AnneeData = {
      semestres: [
        {
          nbSemaines: 15,
          affectations: [
            { id: 's1a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 120 },
          ],
        },
        {
          nbSemaines: 15,
          affectations: [
            { id: 's2a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 90 },
          ],
        },
      ],
    };
    const result = calculerCharge(enseignantMCF, ruleSetAnnuelle, undefined, annee);

    expect(result.volumeBrut).toBe(52.5);
    expect(result.chargeCalculee).toBe(52.5);
  });

  it('ANNUELLE avec semestre vide → 0 pour ce semestre', () => {
    const ruleSetAnnuelle: ChargeRuleSetInput = { ...ruleSet, periode: 'ANNUELLE' };
    const annee: AnneeData = {
      semestres: [
        {
          nbSemaines: 15,
          affectations: [
            { id: 's1a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 120 },
          ],
        },
        {
          nbSemaines: 15,
          affectations: [],
        },
      ],
    };
    const result = calculerCharge(enseignantMCF, ruleSetAnnuelle, undefined, annee);

    expect(result.volumeBrut).toBe(30);
    expect(result.chargeCalculee).toBe(30);
  });

  // ---- Service dû avec décharges ----
  it('calcule le service dû avec décharges, plancher à 0', () => {
    const enseignantAvecDecharges: EnseignantChargeInput = {
      id: 'ens-3',
      grade: 'MCF',
      decharges: [50],
    };
    const result = calculerCharge(enseignantAvecDecharges, ruleSet, semestre15);

    expect(result.decharges).toBe(50);
    expect(result.serviceDu).toBe(192 - 50);
    expect(result.ecart).toBe(result.chargeCalculee - 142);
  });

  it('serviceDu ne descend pas en dessous de 0 (décharges > référence)', () => {
    const enseignantTropDecharges: EnseignantChargeInput = {
      id: 'ens-4',
      grade: 'MCF',
      decharges: [250],
    };
    const result = calculerCharge(enseignantTropDecharges, ruleSet, semestre15);

    expect(result.serviceDu).toBe(0);
    expect(result.ecart).toBe(result.chargeCalculee);
  });

  // ---- Heures supplémentaires avec seuil et plafond ----
  it('heuresSup = 0 quand ecart <= seuil', () => {
    const ruleSetAvecSeuil: ChargeRuleSetInput = {
      ...ruleSet,
      seuilHeuresSup: 5,
    };
    const result = calculerCharge(enseignantMCF, ruleSetAvecSeuil, semestre15);
    expect(result.heuresSup).toBe(0);
  });

  it('calcule les heures sup quand ecart > seuil', () => {
    const ruleSetAvecSeuil: ChargeRuleSetInput = {
      ...ruleSet,
      periode: 'SEMESTRIELLE',
      seuilHeuresSup: 10,
    };
    const enseignantChargeHaute: EnseignantChargeInput = {
      id: 'ens-5',
      grade: 'MCF',
      decharges: [],
    };
    const semestreChargeHaute: SemestreData = {
      nbSemaines: 15,
      affectations: [
        { id: 'a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 1200 },
      ],
    };
    const result = calculerCharge(
      enseignantChargeHaute,
      ruleSetAvecSeuil,
      semestreChargeHaute
    );
    expect(result.ecart).toBe(300 - 192);
    expect(result.heuresSup).toBe(108 - 10);
  });

  it('depassePlafond est vrai quand heuresSup > plafondHeuresSup', () => {
    const ruleSetAvecPlafond: ChargeRuleSetInput = {
      ...ruleSet,
      periode: 'SEMESTRIELLE',
      seuilHeuresSup: 0,
      plafondHeuresSup: 50,
    };
    const enseignantChargeHaute: EnseignantChargeInput = {
      id: 'ens-6',
      grade: 'MCF',
      decharges: [],
    };
    const semestreChargeHaute: SemestreData = {
      nbSemaines: 15,
      affectations: [
        { id: 'a1', module: 'Math', type: 'CM', volumeHebdoMinutes: 1200 },
      ],
    };
    const result = calculerCharge(
      enseignantChargeHaute,
      ruleSetAvecPlafond,
      semestreChargeHaute
    );
    expect(result.heuresSup).toBe(108);
    expect(result.depassePlafond).toBe(true);
  });

  it('depassePlafond est faux quand plafondHeuresSup est null', () => {
    const ruleSetSansPlafond: ChargeRuleSetInput = {
      ...ruleSet,
      plafondHeuresSup: null,
    };
    const result = calculerCharge(enseignantMCF, ruleSetSansPlafond, semestre15);
    expect(result.depassePlafond).toBe(false);
  });

  // ---- Détail par activité ----
  it('retourne le détail par activité (type, volume, coefficient, contribution)', () => {
    const result = calculerCharge(enseignantMCF, ruleSet, semestre15);

    const cmDetail = result.detail.find(d => d.type === 'CM');
    expect(cmDetail).toBeDefined();
    expect(cmDetail?.volume).toBe(2);
    expect(cmDetail?.coefficient).toBe(1.0);
    expect(cmDetail?.contribution).toBe(2);

    const tdDetail = result.detail.find(d => d.type === 'TD');
    expect(tdDetail).toBeDefined();
    expect(tdDetail?.volume).toBe(1.5);
    expect(tdDetail?.coefficient).toBe(0.75);
    expect(tdDetail?.contribution).toBe(1.13); // 1.125 arrondi à 2 décimales
  });

  // ---- Arrondi ----
  it('arrondit selon arrondiDecimales (2 par défaut)', () => {
    const ruleSetArrondi: ChargeRuleSetInput = {
      ...ruleSet,
      arrondiDecimales: 1,
    };
    const result = calculerCharge(enseignantMCF, ruleSetArrondi, semestre15);
    expect(result.chargeCalculee).toBe(3.1);
  });

  // ---- Entrées manquantes selon la période ----
  it('lève ConfigurationError si semestre manquant pour HEBDOMADAIRE', () => {
    expect(() => calculerCharge(enseignantMCF, ruleSet)).toThrow(ConfigurationError);
  });

  it('lève ConfigurationError si année manquante pour ANNUELLE', () => {
    const ruleSetAnnuelle: ChargeRuleSetInput = { ...ruleSet, periode: 'ANNUELLE' };
    expect(() => calculerCharge(enseignantMCF, ruleSetAnnuelle)).toThrow(
      ConfigurationError
    );
  });
});