/* ============================================================================
   Tableau de bord (L5-27)
   GET /tableau-de-bord?semestreId=&actions=
   Aligné sur TableauDeBordResponseDto du backend L5-26
   ============================================================================ */

import { apiFetch } from './client';

export interface ActionPrioritaire {
  code: string;
  pourquoi: string;
  lien: string;
}

export interface Contexte {
  annee: string;
  semestre: string;
}

export interface Repartition {
  departementCode: string;
  statut: string;
  avancement: string;
}

export interface PreparationResume {
  peutGenerer: boolean;
  nbBloquants: number;
  nbAvertissements: number;
  nbInfos: number;
  controles: Array<{ code: string; niveau: string; message: string }>;
}

export interface GenerationResume {
  enCours: Array<{ id: string; statut: string; progres: number }>;
  recentes: Array<{ id: string; statut: string; at: string }>;
}

export interface VersionPubliee {
  id: string;
  numero: string;
  statut: string;
  provenance: {
    generationId: string | null;
    adaptateur: string | null;
    versionFET: string | null;
    seancesOrigine: number | null;
    at: string | null;
  };
}

export interface Changements {
  departements: Array<{ code: string; libelle: string; impactes: number }>;
  totalImpactes: number;
}

export interface ResponsableView {
  repartitions: Repartition[];
  charges: Array<{ enseignantId: string; nom: string; chargeCalculee: number; serviceDu: number; alerte: boolean }>;
  validationsEnAttente: number;
  demandesOuvertes: number;
}

export interface DirectionView {
  versionPubliee: VersionPubliee | null;
  exportsDisponibles: boolean;
}

export interface TableauDeBordResponse {
  role: string;
  contexte: Contexte;
  repartitions?: Repartition[];
  validationsEnAttente?: string[];
  preparation?: PreparationResume;
  versionEnPreparation?: {
    id: string;
    numero: string;
    statut: string;
    conflitsBloquants: number;
    nonPlacees: number;
  };
  generations?: GenerationResume;
  versionPubliee?: VersionPubliee;
  changements?: Changements;
  actionsPrioritaires?: ActionPrioritaire[];
  responsable?: ResponsableView;
  direction?: DirectionView;
}

/**
 * Récupère le tableau de bord agrégé par rôle pour un semestre donné.
 * Si semestreId est omis, le backend utilise le semestre actif.
 */
export async function fetchTableauDeBord(
  semestreId?: string,
  actionsAll = false,
): Promise<TableauDeBordResponse> {
  const url = new URL(`/tableau-de-bord`, typeof window === 'undefined'
    ? 'http://localhost:3000'
    : window.location.origin);
  if (semestreId) url.searchParams.set('semestreId', semestreId);
  if (actionsAll) url.searchParams.set('actions', 'all');

  const res = await apiFetch(url.toString());
  return res.json() as Promise<TableauDeBordResponse>;
}
