import { z } from 'zod';

// Prisma enums (defined locally to avoid dependency on @prisma/client)
export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ActivityType = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'COMMENTED' | 'MOVED';

// Zod schemas for API validation
export const userRoleSchema = z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']);
export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const projectStatusSchema = z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']);
export const sprintStatusSchema = z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

// Common schemas
export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationParams = z.infer<typeof paginationSchema>;

export const paginationResponseSchema = z.object({
  data: z.array(z.unknown()),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export type PaginationResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Error response schema (RFC 9457)
export const problemDetailsSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(),
  requestId: z.string().optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
