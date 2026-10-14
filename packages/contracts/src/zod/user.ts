import { z } from 'zod';
import {
  uuidSchema,
  emailSchema,
  isoDateTimeSchema,
  paginationQuerySchema,
  paginatedResponseSchema,
} from './common.js';
import { roleCodeSchema } from './enums.js';

// ============================================================
// Utilisateurs — Schémas Zod
// Alignés sur ST §3.4 Users endpoints et §5.1
// ============================================================

/** Rôle utilisateur avec portée département */
export const userRoleSchema = z.object({
  role: roleCodeSchema,
  departementCode: z.string().max(20).nullable(),
});
export type UserRole = z.infer<typeof userRoleSchema>;

/** DTO Utilisateur (réponse) */
export const userDtoSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  nom: z.string().max(100),
  prenom: z.string().max(100),
  roles: z.array(userRoleSchema),
  actif: z.boolean(),
  desactiveLe: isoDateTimeSchema.nullable(),
  lastLoginAt: isoDateTimeSchema.nullable(),
  mfaActive: z.boolean(),
  mustChangePassword: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type UserDto = z.infer<typeof userDtoSchema>;

/** Création d'utilisateur (admin) */
export const createUserInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  role: roleCodeSchema,
  departementCode: z.string().max(20).nullable().optional(),
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

/** Mise à jour d'utilisateur (admin ou soi-même) */
export const updateUserInputSchema = z.object({
  email: emailSchema.optional(),
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  roles: z.array(userRoleSchema).optional(),
  actif: z.boolean().optional(),
  departementCode: z.string().max(20).nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni',
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

/** Mise à jour du mot de passe (par l'utilisateur) */
export const updatePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordInputSchema>;

/** Réinitialisation du mot de passe (par admin) */
export const resetPasswordInputSchema = z.object({
  newPassword: z.string().min(12).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

/** Paramètres de requête pour liste utilisateurs */
export const userQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  role: roleCodeSchema.optional(),
  actif: z.boolean().optional(),
  departementCode: z.string().max(20).optional(),
});
export type UserQuery = z.infer<typeof userQuerySchema>;

/** Réponse paginée utilisateurs */
export const paginatedUsersResponseSchema = paginatedResponseSchema(userDtoSchema);
export type PaginatedUsersResponse = z.infer<typeof paginatedUsersResponseSchema>;

/** Utilisateur minimal (pour listes, sélecteurs) */
export const userMinimalSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  nom: z.string(),
  prenom: z.string(),
  roles: z.array(userRoleSchema),
  actif: z.boolean(),
});
export type UserMinimal = z.infer<typeof userMinimalSchema>;

/** Profil utilisateur connecté */
export const myProfileSchema = userDtoSchema.extend({
  permissions: z.array(z.string()), // codes de permission calculés
});
export type MyProfile = z.infer<typeof myProfileSchema>;
