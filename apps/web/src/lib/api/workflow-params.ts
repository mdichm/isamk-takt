import { apiFetch } from './client';

/* ============================================================================
   Paramètres globaux du workflow (L5-19, aligné sur L5-17)
   GET et PATCH /parametres/workflow
   ============================================================================ */

/**
 * Circuit global du workflow (ligne unique ParametreWorkflow, id = 1).
 * Les deux interrupteurs sont activés par défaut.
 */
export interface WorkflowParamsDto {
  /** Validation du planning requise avant soumission. */
  validationPlanningRequise: boolean;
  /** Publication requise après validation de la version. */
  publicationRequise: boolean;
  /** Date de dernière modification des paramètres. */
  updatedAt: string;
  /** Identifiant de l'utilisateur ayant effectué la dernière modification. */
  updatedBy: string | null;
}

/** Données de mise à jour des paramètres du workflow (au moins un champ attendu). */
export interface WorkflowParamsUpdateDto {
  validationPlanningRequise?: boolean;
  publicationRequise?: boolean;
  /** Motif facultatif de la modification (audité). */
  motif?: string;
}

/** Lecture des paramètres globaux du workflow (accessible à tous les rôles). */
export async function fetchWorkflowParams(): Promise<WorkflowParamsDto> {
  const res = await apiFetch('/parametres/workflow');
  return res.json() as Promise<WorkflowParamsDto>;
}

/**
 * Mise à jour des paramètres globaux du workflow (réservé à l'Administrateur).
 * Chaque modification écrit une entrée d'audit (ancienne et nouvelle valeur, motif facultatif).
 */
export async function updateWorkflowParams(
  dto: WorkflowParamsUpdateDto,
): Promise<WorkflowParamsDto> {
  const res = await apiFetch('/parametres/workflow', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return res.json() as Promise<WorkflowParamsDto>;
}
