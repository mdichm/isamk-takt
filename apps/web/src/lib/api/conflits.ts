// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API des conflits et simulation (L3-29)
// Aligné sur ConflitResponseDto et SimulatePlacementResponseDto du backend.

import { apiFetch } from './client';

/** Conflit non résolu d'une version (ConflitResponseDto du backend L3-17). */
export interface Conflit {
  id: string;
  regleCode: string;
  type: string;
  severite: string;
  objetType: string;
  objetId: string;
  seanceIds: string[];
  message: string;
  signature: string;
  details?: Record<string, unknown>;
  resoluLe?: string | null;
  createdAt: string;
}

/** Séverités de conflit supportées par le panneau. */
export type ConflitSeverite = 'BLOQUANT' | 'AVERTISSEMENT';

/** Types de conflit supportés par le panneau. */
export type ConflitType =
  | 'ENSEIGNANT'
  | 'SALLE'
  | 'GROUPE'
  | 'OCCUPATION'
  | string;

/** Résultat de simulation de placement (SimulatePlacementResponseDto). */
export interface SimulatePlacementResponse {
  conflits: Conflit[];
  conflitsBloquants: Conflit[];
  conflitsAvertissements: Conflit[];
  placementValide: boolean;
  impacts: {
    groupes: string[];
    enseignant: string;
    salle: string;
    verrous: string[];
  };
  dureeMs: number;
}

/** Payload de simulation de placement (SimulatePlacementDto). */
export interface SimulatePlacementInput {
  jour: string;
  creneauDebutId: string;
  salleId: string;
}

/* ============================================================================
   Lecture : liste des conflits d'une version
   ============================================================================ */

/** Récupère les conflits non résolus d'une version. */
export async function listConflits(
  versionId: string,
): Promise<Conflit[]> {
  const res = await apiFetch(`/versions/${versionId}/conflits`);
  return (await res.json()) as Conflit[];
}

/** Récupère uniquement les conflits de sévérité AVERTISSEMENT non résolus. */
export async function listAvertissementsConflits(
  versionId: string,
): Promise<Conflit[]> {
  const conflits = await listConflits(versionId);
  return conflits.filter(
    (c) => c.severite === 'AVERTISSEMENT' && !c.resoluLe,
  );
}

/* ============================================================================
   Écriture : simulation de placement (avant dépôt)
   ============================================================================ */

/**
 * Simule un placement pour une séance donnée sans l'écrire en base.
 * POST /seances/{id}/placement:simulate — lecture seule.
 */
export async function simulatePlacement(
  seanceId: string,
  input: SimulatePlacementInput,
): Promise<SimulatePlacementResponse> {
  const res = await apiFetch(`/seances/${seanceId}/placement:simulate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}
