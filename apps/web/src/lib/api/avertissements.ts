// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Client API des avertissements (L3-40)
// Aligné sur AvertissementAccepteResponseDto et ConflitResponseDto du backend.

import { apiFetch } from './client';

/** Réponse d'acceptation d'un avertissement (AvertissementAccepteResponseDto). */
export interface AvertissementAccepteResponse {
  id: string;
  versionId: string;
  regleCode: string;
  signature: string;
  seanceIds: string[];
  auteurId: string;
  justification?: string;
  versionRevision: number;
  acceptePar: string;
  accepteLe: string;
  caduqueLe?: string;
  impact: {
    seanceIds: string[];
    regleCode: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Payload d'acceptation (AcceptAvertissementDto). */
export interface AccepterAvertissementInput {
  signature: string;
  justification?: string;
}

/** Avertissement dans la liste des conflits (type aligné sur ConflitResponseDto côté back). */
export interface AvertissementConflit {
  id: string;
  versionId?: string;
  regleCode: string;
  signature: string;
  seanceIds: string[];
  type: 'ROOM' | 'EQUIPEMENT' | 'ENSEIGNANT' | 'GROUPE' | 'TEACHER';
  severite: 'AVERTISSEMENT' | 'BLOQUANT';
  objetType: 'Seance' | 'Creneau';
  objetId: string;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
  resoluLe: string | null;
  accepte?: boolean;
}

/* ============================================================================
   Lecture : liste des avertissements d'une version
   ============================================================================ */

/**
 * Récupère les avertissements non acceptés d'une version.
 * GET /versions/:id/conflits (filtré côté client pour severite=AVERTISSEMENT non résolus)
 */
export async function listAvertissements(versionId: string): Promise<AvertissementConflit[]> {
  const res = await apiFetch(`/versions/${versionId}/conflits`);
  const conflits: AvertissementConflit[] = await res.json();
  // Filtrer : seulement les avertissements (severite=AVERTISSEMENT) non résolus (resoluLe=null)
  return conflits.filter(
    (c) => c.severite === 'AVERTISSEMENT' && c.resoluLe === null,
  );
}

/* ============================================================================
   Écriture : acceptation d'un avertissement
   ============================================================================ */

/**
 * Accepte un avertissement via POST /versions/:id/avertissements:accept.
 * Retourne le DTO d'acceptation avec l'impact détaillé.
 */
export async function accepterAvertissement(
  versionId: string,
  input: AccepterAvertissementInput,
): Promise<AvertissementAccepteResponse> {
  const res = await apiFetch(
    `/versions/${versionId}/avertissements:accept`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.json();
}
