import { z } from 'zod';

/**
 * UUID v4 schema
 */
export const uuidSchema = z.string().uuid({ message: 'Identifiant invalide (UUID v4 requis)' });

export type Uuid = z.infer<typeof uuidSchema>;

/**
 * Email schema with French validation message
 */
export const emailSchema = z.string().email({ message: 'Adresse email invalide' }).toLowerCase().trim();

export type Email = z.infer<typeof emailSchema>;

/**
 * ISO 8601 date string (YYYY-MM-DD)
 */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date invalide (format YYYY-MM-DD requis)' });

export type IsoDate = z.infer<typeof isoDateSchema>;

/**
 * ISO 8601 datetime string
 */
export const isoDateTimeSchema = z.string().datetime({ offset: true, message: 'Date/heure invalide (ISO 8601 requis)' });

export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;

/**
 * Cursor for pagination (opaque string)
 */
export const cursorSchema = z.string().optional();

export type Cursor = z.infer<typeof cursorSchema>;

/**
 * Pagination query parameters (cursor-based)
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: cursorSchema,
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Paginated response wrapper
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
};

/**
 * Idempotency key for POST requests
 */
export const idempotencyKeySchema = z.string().uuid().optional();

export type IdempotencyKey = z.infer<typeof idempotencyKeySchema>;

/**
 * RFC 9457 Problem Details schema
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export const problemDetailsSchema = z.object({
  type: z.string().url({ message: 'Type d\'erreur invalide (URI requis)' }),
  title: z.string().min(1, { message: 'Titre requis' }),
  status: z.number().int().min(100).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(),
  requestId: z.string().optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
  conflits: z.array(z.object({
    type: z.string(),
    severite: z.string(),
    regleCode: z.string(),
    objet: z.object({
      type: z.string(),
      id: z.string(),
    }).optional(),
    seanceIds: z.array(z.string()).optional(),
    message: z.string(),
  })).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

/**
 * ETag schema (revision for optimistic locking)
 */
export const etagSchema = z.string().regex(/^"?[a-f0-9-]+"?$/i);

export type ETag = z.infer<typeof etagSchema>;

/**
 * If-Match header schema
 */
export const ifMatchSchema = z.string().regex(/^"?[a-f0-9-]+"?$/i);

export type IfMatch = z.infer<typeof ifMatchSchema>;
