import { apiFetch } from './client';
import {
  createUserInputSchema,
  updateUserInputSchema,
  userDtoSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserDto,
} from '@takt/contracts';
/**
 * Paramètres de requête pour la liste des utilisateurs (adaptés au backend).
 */
export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  actif?: boolean;
  departementCode?: string;
}

/**
 * Réponse paginée utilisateurs (adaptée au backend).
 */
export interface PaginatedUsersResponse {
  data: UserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Liste les utilisateurs avec pagination et filtres.
 */
export async function listUsers(query: UserQuery): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.role) params.set('role', query.role);
  if (query.actif !== undefined) params.set('actif', String(query.actif));
  if (query.departementCode) params.set('departementCode', query.departementCode);

  const response = await apiFetch(`/users?${params.toString()}`);
  return response.json();
}

/**
 * Récupère un utilisateur par son ID.
 */
export async function getUser(id: string): Promise<UserDto> {
  const response = await apiFetch(`/users/${id}`);
  const data = await response.json();
  return userDtoSchema.parse(data);
}

/**
 * Crée un nouvel utilisateur (réservé à l'Administrateur).
 */
export async function createUser(data: CreateUserInput): Promise<UserDto> {
  const validated = createUserInputSchema.parse(data);
  const response = await apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(validated),
  });
  const body = await response.json();
  return userDtoSchema.parse(body);
}

/**
 * Met à jour un utilisateur existant (réservé à l'Administrateur).
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput,
): Promise<UserDto> {
  const validated = updateUserInputSchema.parse(data);
  const response = await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(validated),
  });
  const body = await response.json();
  return userDtoSchema.parse(body);
}

/**
 * Active ou désactive un utilisateur (réservé à l'Administrateur).
 */
export async function toggleUserActive(
  id: string,
  isActive: boolean,
): Promise<UserDto> {
  return updateUser(id, { actif: isActive });
}

/**
 * Déclenche une réinitialisation de mot de passe par l'Administrateur.
 * L'Administrateur ne voit jamais le mot de passe.
 */
export async function resetUserPassword(id: string): Promise<{ message: string }> {
  const response = await apiFetch(`/users/${id}/reset-password`, {
    method: 'POST',
  });
  return response.json();
}

export type { UserDto, CreateUserInput, UpdateUserInput };
