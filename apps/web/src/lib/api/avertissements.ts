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
