import { z } from 'zod';
import { 
  uuidSchema, 
  emailSchema, 

  isoDateTimeSchema 
} from './common.js';
import { roleCodeSchema } from './enums.js';

// ============================================================
// Authentification — Schémas Zod
// Alignés sur ST §3.4.1 POST /auth/login et §5.1
// ============================================================

/** Requête de connexion */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Mot de passe requis' }),
  totp: z.string().regex(/^\d{6}$/, { message: 'Code TOTP invalide (6 chiffres)' }).optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

/** Requête d'inscription (admin uniquement) */
export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' }).max(128),
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  role: roleCodeSchema,
  departementCode: z.string().max(20).optional(), // requis pour RESPONSABLE_DEPARTEMENT
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/** Requête de refresh token */
export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token requis' }),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

/** Requête MFA */
export const mfaRequestSchema = z.object({
  totp: z.string().regex(/^\d{6}$/, { message: 'Code TOTP invalide (6 chiffres)' }),
});
export type MfaRequest = z.infer<typeof mfaRequestSchema>;

/** Utilisateur dans la réponse d'auth */
export const authUserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  nom: z.string(),
  prenom: z.string(),
  roles: z.array(z.object({
    role: roleCodeSchema,
    departementCode: z.string().nullable(),
  })),
  mfaActive: z.boolean(),
  mustChangePassword: z.boolean(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

/** Paire de tokens (accès + refresh) */
export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(), // secondes
  refreshToken: z.string().min(1), // opaque, retourné une seule fois à la création
  user: authUserSchema,
});
export type TokenPair = z.infer<typeof tokenPairSchema>;

/** Réponse de connexion réussie (sans refreshToken dans le body, il est en cookie) */
export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  mustChangePassword: z.boolean(),
  user: authUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** Réponse de déconnexion */
export const logoutResponseSchema = z.object({
  message: z.literal('Déconnexion réussie'),
});
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

/** Réponse de refresh réussie */
export const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/** Demande de réinitialisation de mot de passe (initiation) */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

/** Confirmation de réinitialisation de mot de passe */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, { message: 'Token requis' }),
  password: z.string().min(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' }).max(128),
});
export type PasswordResetConfirm = z.infer<typeof passwordResetConfirmSchema>;

/** Changement de mot de passe (utilisateur connecté) */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Mot de passe actuel requis' }),
  newPassword: z.string().min(12, { message: 'Le nouveau mot de passe doit contenir au moins 12 caractères' }).max(128),
});
export type ChangePassword = z.infer<typeof changePasswordSchema>;

/** Règles de complexité du mot de passe */
export const passwordRulesSchema = z.object({
  majuscule: z.boolean().default(true),
  minuscule: z.boolean().default(true),
  chiffre: z.boolean().default(true),
  symbole: z.boolean().default(true),
});
export type PasswordRules = z.infer<typeof passwordRulesSchema>;

/** Paramètres de sécurité (lecture) */
export const securityParamsSchema = z.object({
  longueurMin: z.number().int().min(8).default(12),
  regles: passwordRulesSchema.default({ majuscule: true, minuscule: true, chiffre: true, symbole: true }),
  expirationJours: z.number().int().min(0).default(0),
  historique: z.number().int().min(1).default(5),
  maxEchecs: z.number().int().min(1).default(5),
  verrouillageMinutes: z.number().int().min(1).default(15),
  inactiviteMinutes: z.number().int().min(1).default(30),
  mfaRoles: z.array(roleCodeSchema).default(['ADMINISTRATEUR', 'GESTIONNAIRE']),
});
export type SecurityParams = z.infer<typeof securityParamsSchema>;

/** Événement de sécurité (audit) */
export const securityEventSchema = z.object({
  id: uuidSchema,
  type: z.enum([
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET_REQUEST',
    'PASSWORD_RESET_CONFIRM',
    'MFA_ENABLE',
    'MFA_DISABLE',
    'TOKEN_REVOKED',
    'ACCOUNT_LOCKED',
    'ACCOUNT_UNLOCKED',
    'SESSION_EXPIRED',
  ]),
  userId: uuidSchema.nullable(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  detail: z.string().optional(),
  createdAt: isoDateTimeSchema,
});
export type SecurityEvent = z.infer<typeof securityEventSchema>;
