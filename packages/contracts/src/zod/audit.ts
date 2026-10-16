import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema, paginationQuerySchema } from './common.js';

// ============================================================
// Audit — Schémas Zod
// Alignés sur ST §3.3, §5.3 (Consultation de l'audit)
// ============================================================

/** Entrée d'audit métier (réponse) */
export const auditEntrySchema = z.object({
  id: z.string(),
  at: isoDateTimeSchema,
  userId: z.string().uuid().nullable(),
  action: z.string().min(1),
  objetType: z.string().min(1),
  objetId: z.string().min(1),
  ancienneValeur: z.unknown().nullable(),
  nouvelleValeur: z.unknown().nullable(),
  versionId: z.string().uuid().nullable(),
  motif: z.string().nullable(),
  requestId: z.string().nullable(),
  ip: z.string().nullable(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

/** Filtres de requête d'audit + pagination par curseur */
export const auditQuerySchema = paginationQuerySchema.extend({
  objetType: z.string().optional(),
  objetId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

/** Réponse paginée d'entrées d'audit */
export const paginatedAuditResponseSchema = z.object({
  data: z.array(auditEntrySchema),
  nextCursor: z.string().nullable(),
});
export type PaginatedAuditResponse = z.infer<typeof paginatedAuditResponseSchema>;
