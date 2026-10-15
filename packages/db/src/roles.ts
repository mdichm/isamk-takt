// UserRole enum for application-level role checks
// Maps to RoleCode enum in Prisma schema
export enum UserRole {
  ADMIN = 'ADMINISTRATEUR',
  MANAGER = 'GESTIONNAIRE',
  VIEWER = 'ETUDIANT',
}

// Helper to check if a RoleCode is an admin role
export function isAdminRole(role: string): boolean {
  return role === UserRole.ADMIN;
}

// Helper to check if a RoleCode is a manager role
export function isManagerRole(role: string): boolean {
  return role === UserRole.MANAGER || role === UserRole.ADMIN;
}
