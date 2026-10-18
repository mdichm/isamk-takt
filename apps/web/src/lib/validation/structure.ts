import { z } from 'zod';

/* ============================================================================
   Schémas de validation pour les formulaires de structure académique
   ============================================================================ */

export const departementSchema = z.object({
  anneeId: z.string().uuid({ message: 'Une année universitaire est requise.' }),
  code: z.string().min(1, { message: 'Le code est requis.' }).max(50),
  libelle: z.string().min(1, { message: 'Le libellé est requis.' }).max(200),
  ordre: z.number().int().min(0).optional(),
  originId: z.string().uuid().optional().or(z.literal('')),
});

export const formationSchema = z.object({
  departementId: z.string().uuid({ message: 'Un département est requis.' }),
  code: z.string().min(1, { message: 'Le code est requis.' }).max(50),
  libelle: z.string().min(1, { message: 'Le libellé est requis.' }).max(200),
  ordre: z.number().int().min(0).optional(),
  originId: z.string().uuid().optional().or(z.literal('')),
});

export const niveauSchema = z.object({
  formationId: z.string().uuid({ message: 'Une formation est requise.' }),
  code: z.string().min(1, { message: 'Le code est requis.' }).max(50),
  libelle: z.string().min(1, { message: 'Le libellé est requis.' }).max(200),
  ordre: z.number().int().min(0).optional(),
  originId: z.string().uuid().optional().or(z.literal('')),
});

export const groupeSchema = z.object({
  niveauId: z.string().uuid({ message: 'Un niveau est requis.' }),
  semestreId: z.string().uuid({ message: 'Un semestre est requis.' }),
  parentId: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(['SECTION', 'GROUPE', 'SOUS_GROUPE']),
  code: z.string()
    .min(1, { message: 'Le code est requis.' })
    .max(50)
    .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, {
      message: 'Code invalide (ex: L1-INFO-G1).',
    }),
  libelle: z.string().min(1, { message: 'Le libellé est requis.' }).max(200),
  effectif: z.string().optional(),
  ordre: z.number().int().min(0).optional(),
});

export type DepartementFormValues = z.infer<typeof departementSchema>;
export type FormationFormValues = z.infer<typeof formationSchema>;
export type NiveauFormValues = z.infer<typeof niveauSchema>;
export type GroupeFormValues = z.infer<typeof groupeSchema>;
