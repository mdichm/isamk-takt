export { prisma, default, PrismaClient, PrismaPg } from './client.js';
export * from './generated/prisma/client/index.js';
export { $Enums } from './generated/prisma/client/index.js';

// Re-export individual enums for convenience
export { 
  GenerationStatut,
  GenerationMode,
  ContrainteNature,
  ExigenceNiveau,
  RoleCode,
  AuthProvider,
  UserRole,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  SprintStatus,
  ActivityType,
  AnneeStatut,
  RepartitionStatut,
  DemandeStatut,
  DemandeType,
  GroupeType,
  JourSemaine,
  GrilleAffichage,
  ContrainteCategorie,
  ContraintePortee,
  FetSupport,
  ClasseRegle,
  TraductionFET,
  JobStatut,
  VersionStatut,
  SeanceStatut,
  SeanceOrigine,
  RessourceType,
  ExportFormat,
} from './generated/prisma/client/index.js';
