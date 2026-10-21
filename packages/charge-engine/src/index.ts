// Charge Engine - Pure TypeScript workload calculation
// Implémentation du moteur de calcul de la charge (L2-04) conformément à ST §4.2
// Aucune dépendance NestJS / Prisma : paquet pur, partagé par l'API et le worker.

/** Erreur de configuration : coefficient ou charge de référence manquante */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/** Période de calcul de la charge (aligné sur chargePeriodeSchema dans @takt/contracts) */
export type ChargePeriode = 'HEBDOMADAIRE' | 'SEMESTRIELLE' | 'ANNUELLE';

const DEFAULT_ARRONDI = 2;

/** Arrondi à N décimales */
function round(value: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(value * factor) / factor;
}

/** Une affectation pour le calcul de charge */
export interface AffectationCharge {
  id: string;
  groupeCommunKey?: string; // CM commun : déduplication par (groupeCommunKey, module, type, enseignant)
  module: string;
  type: string;
  volumeHebdoMinutes: number;
}

/** Données d'un semestre pour le calcul */
export interface SemestreData {
  nbSemaines: number;
  affectations: AffectationCharge[];
}

/** Données d'une année (requis pour le calcul ANNUELLE) */
export interface AnneeData {
  semestres: SemestreData[];
}

/** Coefficient de charge par type et optionnellement par grade */
export interface ChargeCoefficient {
  type: string;
  grade?: string; // undefined = coefficient général pour le type
  value: number;
}

/** Charge de référence par grade */
export interface ChargeReferenceGrade {
  grade: string;
  value: number;
}

/** Jeu de règles de charge (issu de ChargeRuleSet publié) */
export interface ChargeRuleSetInput {
  numero: number;
  periode: ChargePeriode;
  seuilHeuresSup?: number;   // en heures
  plafondHeuresSup?: number | null; // en heures, null = pas de plafond
  arrondiDecimales?: number; // 2 par défaut
  coefficients: ChargeCoefficient[];
  chargeReference: ChargeReferenceGrade[];
}

/** Données de l'enseignant */
export interface EnseignantChargeInput {
  id: string;
  grade: string;
  decharges: number[]; // heures de décharge par période
}

/** Détail par activité */
export interface ActiviteDetail {
  type: string;
  volume: number;        // heures hebdo
  coefficient: number;
  contribution: number;  // volume × coefficient
  groupeCommunKey?: string;
}

/** Résultat du calcul de charge */
export interface ChargeResult {
  enseignantId: string;
  volumeBrut: number;           // heures
  chargeCalculee: number;       // heures (base)
  chargeReference: number;      // heures (charge de référence du grade)
  decharges: number;            // heures
  serviceDu: number;            // heures
  ecart: number;                // chargeCalculee − serviceDu
  heuresSup: number;
  depassePlafond: boolean;
  detail: ActiviteDetail[];
  periode: ChargePeriode;
}

/**
 * Résout le coefficient applicable pour un (type, grade).
 * Règle : coefficient propre au grade s'il existe, sinon coefficient général du type.
 * Manquant → ConfigurationError (jamais de valeur par défaut silencieuse).
 */
function getCoefficient(
  ruleSet: ChargeRuleSetInput,
  type: string,
  grade: string
): number {
  const specific = ruleSet.coefficients.find(
    c => c.type === type && c.grade === grade
  );
  if (specific) return specific.value;

  const general = ruleSet.coefficients.find(
    c => c.type === type && c.grade === undefined
  );
  if (general) return general.value;

  throw new ConfigurationError(
    `Coefficient manquant pour le type "${type}" et le grade "${grade}"`
  );
}

/**
 * Résout la charge de référence pour un grade.
 * Absent → ConfigurationError.
 */
function getChargeReference(
  ruleSet: ChargeRuleSetInput,
  grade: string
): number {
  const ref = ruleSet.chargeReference.find(r => r.grade === grade);
  if (!ref) {
    throw new ConfigurationError(
      `Charge de référence manquante pour le grade "${grade}"`
    );
  }
  return ref.value;
}

/**
 * Déduplique les affectations en CM commun.
 * Les affectations partageant (groupeCommunKey, module, type) forment une seule activité ;
 * elles comptent UNE fois (volume d'une séance commune).
 * Les affectations sans groupeCommunKey sont conservées individuellement (clé = id).
 */
function deduplicaterCM(
  affectations: AffectationCharge[]
): AffectationCharge[] {
  const seen = new Set<string>();
  const activites: AffectationCharge[] = [];

  for (const a of affectations) {
    const key = a.groupeCommunKey
      ? `CM:${a.groupeCommunKey}:${a.module}:${a.type}`
      : `ID:${a.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    activites.push(a);
  }

  return activites;
}

/**
 * Calcule la charge d'un enseignant conformément à ST §4.2.
 *
 * Étapes :
 *   0. Déduplication CM commun
 *   1. Volume hebdomadaire brut et pondéré (coefficients)
 *   2. Conversion vers la période du jeu de règles (HEBDOMADAIRE / SEMESTRIELLE / ANNUELLE)
 *   3. Service dû = max(0, charge de référence − décharges)
 *   4. Écart, heures supplémentaires (seuil, plafond)
 *
 * @param enseignant - l'enseignant (id, grade, décharges)
 * @param ruleSet - le jeu de règles de charge publié
 * @param semestre - données du semestre (requis pour HEBDOMADAIRE / SEMESTRIELLE)
 * @param annee - données de l'année (requis pour ANNUELLE)
 */
export function calculerCharge(
  enseignant: EnseignantChargeInput,
  ruleSet: ChargeRuleSetInput,
  semestre?: SemestreData,
  annee?: AnneeData
): ChargeResult {
  const arrondi = ruleSet.arrondiDecimales ?? DEFAULT_ARRONDI;
  const periode = ruleSet.periode;

  // ---- Validation des entrées selon la période ----
  if (periode === 'ANNUELLE' && !annee) {
    throw new ConfigurationError(
      'Les données de l\'année sont requises pour une période ANNUELLE'
    );
  }
  if (
    (periode === 'HEBDOMADAIRE' || periode === 'SEMESTRIELLE') &&
    !semestre
  ) {
    throw new ConfigurationError(
      `Les données du semestre sont requises pour une période ${periode}`
    );
  }

  const semestres = periode === 'ANNUELLE' ? annee!.semestres : [semestre!];

  // ---- 0 + 1. Déduplication CM commun + volume brut et charge hebdo par semestre ----
  const semestreData = semestres.map(sem => {
    const activites = deduplicaterCM(sem.affectations);
    let brutHebdo = 0;
    let chargeHebdo = 0;
    for (const a of activites) {
      const volume = a.volumeHebdoMinutes / 60;
      const coef = getCoefficient(ruleSet, a.type, enseignant.grade);
      brutHebdo += volume;
      chargeHebdo += volume * coef;
    }
    return { nbSemaines: sem.nbSemaines, brutHebdo, chargeHebdo, activites };
  });

  // ---- 2. Conversion vers la période du jeu de règles ----
  let volumeBrut: number;
  let chargeCalculee: number;

  if (periode === 'HEBDOMADAIRE') {
    volumeBrut = round(semestreData[0].brutHebdo, arrondi);
    chargeCalculee = round(semestreData[0].chargeHebdo, arrondi);
  } else if (periode === 'SEMESTRIELLE') {
    const s = semestreData[0];
    volumeBrut = round(s.brutHebdo * s.nbSemaines, arrondi);
    chargeCalculee = round(s.chargeHebdo * s.nbSemaines, arrondi);
  } else {
    // ANNUELLE : base = Σ sur semestres (chargeHebdo_s × nbSemaines_s)
    let totalBrut = 0;
    let totalCharge = 0;
    for (const s of semestreData) {
      totalBrut += s.brutHebdo * s.nbSemaines;
      totalCharge += s.chargeHebdo * s.nbSemaines;
    }
    volumeBrut = round(totalBrut, arrondi);
    chargeCalculee = round(totalCharge, arrondi);
  }

  // ---- 3. Service dû ----
  const totalDecharges = round(
    enseignant.decharges.reduce((sum, d) => sum + d, 0),
    arrondi
  );
  const chargeReference = getChargeReference(ruleSet, enseignant.grade);
  const serviceDu = round(Math.max(0, chargeReference - totalDecharges), arrondi);

  // ---- 4. Écart et heures supplémentaires ----
  const ecart = round(chargeCalculee - serviceDu, arrondi);
  const seuil = ruleSet.seuilHeuresSup ?? 0;
  const heuresSup = round(Math.max(0, ecart - seuil), arrondi);
  const depassePlafond =
    ruleSet.plafondHeuresSup != null && heuresSup > ruleSet.plafondHeuresSup;

  // ---- Détail par activité (aggrégé par type + groupeCommunKey) ----
  const detailMap = new Map<string, ActiviteDetail>();
  for (const s of semestreData) {
    for (const a of s.activites) {
      const coef = getCoefficient(ruleSet, a.type, enseignant.grade);
      const volume = round(a.volumeHebdoMinutes / 60, arrondi);
      const contribution = round(volume * coef, arrondi);
      const key = a.groupeCommunKey ? `CM:${a.groupeCommunKey}` : `ID:${a.id}`;
      const existing = detailMap.get(key);
      if (existing) {
        existing.volume = round(existing.volume + volume, arrondi);
        existing.contribution = round(existing.contribution + contribution, arrondi);
      } else {
        detailMap.set(key, {
          type: a.type,
          volume,
          coefficient: coef,
          contribution,
          groupeCommunKey: a.groupeCommunKey,
        });
      }
    }
  }

  return {
    enseignantId: enseignant.id,
    volumeBrut,
    chargeCalculee,
    chargeReference,
    decharges: totalDecharges,
    serviceDu,
    ecart,
    heuresSup,
    depassePlafond,
    detail: Array.from(detailMap.values()),
    periode,
  };
}
