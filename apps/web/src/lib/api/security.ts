import { apiFetch } from './client';

/** Paramètres de sécurité (lu depuis le backend). */
export interface SecurityConfigDto {
  id: number;
  longueurMin: number;
  regles: Record<string, unknown>;
  expirationJours: number;
  historique: number;
  maxEchecs: number;
  verrouillageMinutes: number;
  inactiviteMinutes: number;
  mfaRoles: string[];
  conservationAuditJours: number | null;
  conservationSecuriteJours: number;
  conservationExportJours: number | null;
  updatedAt: string;
  updatedBy: string | null;
}

/** Données de mise à jour des paramètres de sécurité. */
export interface UpdateSecurityConfigDto {
  longueurMin?: number;
  regles?: Record<string, unknown>;
  expirationJours?: number;
  historique?: number;
  maxEchecs?: number;
  verrouillageMinutes?: number;
  inactiviteMinutes?: number;
  mfaRoles?: string[];
  conservationAuditJours?: number | null;
  conservationSecuriteJours?: number;
  conservationExportJours?: number | null;
}

/** Entrée d'événement de sécurité (journal). */
export interface SecurityEventDto {
  id: string;
  at: string;
  type: string;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
}

/** Réponse paginée d'événements de sécurité. */
export interface PaginatedSecurityEventsResponse {
  data: SecurityEventDto[];
  nextCursor: string | null;
}

/** Filtres de consultation du journal de sécurité. */
export interface SecurityEventQuery {
  type?: string;
  userId?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

/** Lecture des paramètres de sécurité (réservé à l'Administrateur). */
export async function getSecurityConfig(): Promise<SecurityConfigDto> {
  const response = await apiFetch('/parametres-securite');
  return response.json();
}

/** Mise à jour des paramètres de sécurité (réservé à l'Administrateur). */
export async function updateSecurityConfig(
  data: UpdateSecurityConfigDto,
): Promise<SecurityConfigDto> {
  const response = await apiFetch('/parametres-securite', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

/** Déclenche la purge des journaux (réservé à l'Administrateur). */
export async function purgeJournals(): Promise<{
  auditDeleted: number;
  securityDeleted: number;
  exportDeleted: number;
}> {
  const response = await apiFetch('/audit/purge', {
    method: 'POST',
  });
  return response.json();
}

/** Liste des événements de sécurité avec filtres et pagination (réservé à l'Administrateur). */
export async function listSecurityEvents(
  query: SecurityEventQuery,
): Promise<PaginatedSecurityEventsResponse> {
  const params = new URLSearchParams();
  if (query.type) params.set('type', query.type);
  if (query.userId) params.set('userId', query.userId);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);

  const response = await apiFetch(`/security-events?${params.toString()}`);
  return response.json();
}
