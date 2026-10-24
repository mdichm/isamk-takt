import { apiFetch } from './client';

/* ============================================================================
   Types alignés sur les DTO backend de profil de génération (L4-10)
   ============================================================================ */

export interface Profil {
  id: string;
  semestreId: string;
  nom: string;
  numero: number;
  estParDefaut: boolean;
  dureeLimiteMinutes: number;
  preserverVerrous: boolean;
  engineVersion?: string;
  constructeurVersion?: string;
  graines: unknown[];
  poidsScore: Record<string, unknown>;
  valeursSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfilInput {
  semestreId: string;
  nom: string;
  dureeLimiteMinutes?: number;
  preserverVerrous?: boolean;
  engineVersion?: string;
  constructeurVersion?: string;
  graines?: number[];
  poidsScore?: Record<string, number>;
}

export interface UpdateProfilInput {
  nom?: string;
  dureeLimiteMinutes?: number;
  preserverVerrous?: boolean;
  engineVersion?: string;
  constructeurVersion?: string;
  graines?: number[];
  poidsScore?: Record<string, number>;
}

export interface SetDefaultProfilInput {
  profilId: string;
}

export interface ProfilsQuery {
  page?: number;
  limit?: number;
}

/* ============================================================================
   API fonctions — Profils de génération
   ============================================================================ */

/**
 * Liste les profils de génération d’un semestre.
 * GET /profils/semestres/:semestreId
 */
export async function listProfils(semestreId: string): Promise<Profil[]> {
  const res = await apiFetch(`/profils/semestres/${semestreId}`);
  return res.json();
}

/**
 * Récupère le détail d’un profil.
 * GET /profils/:id
 */
export async function getProfil(id: string): Promise<Profil> {
  const res = await apiFetch(`/profils/${id}`);
  return res.json();
}

/**
 * Crée un profil de génération.
 * POST /profils
 */
export async function createProfil(input: CreateProfilInput): Promise<Profil> {
  const res = await apiFetch('/profils', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.json();
}

/**
 * Modifie un profil de génération.
 * PATCH /profils/:id
 */
export async function updateProfil(
  id: string,
  input: UpdateProfilInput,
): Promise<Profil> {
  const res = await apiFetch(`/profils/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.json();
}

/**
 * Définit le profil par défaut d’un semestre.
 * POST /semestres/:semestreId/profils/defaut
 */
export async function setDefaultProfil(
  semestreId: string,
  input: SetDefaultProfilInput,
): Promise<Profil> {
  const res = await apiFetch(
    `/semestres/${semestreId}/profils/defaut`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.json();
}

/**
 * Récupère le profil par défaut d’un semestre.
 * GET /semestres/:semestreId/profils/defaut
 */
export async function getDefaultProfil(
  semestreId: string,
): Promise<Profil | null> {
  const res = await apiFetch(
    `/semestres/${semestreId}/profils/defaut`,
  );
  return res.json();
}