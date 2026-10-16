import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserActive,
  resetUserPassword,
  type UserQuery,
  type UserDto,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/api/users';
import { getErrorMessage } from '@/lib/api/errors';

// Clés de cache React Query
export const usersKeys = {
  all: ['users'] as const,
  list: (query: UserQuery) => [...usersKeys.all, 'list', query] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des utilisateurs.
 */
export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: () => listUsers(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer un utilisateur par son ID.
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

/**
 * Hook pour créer un utilisateur.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserDto, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

/**
 * Hook pour mettre à jour un utilisateur (rôle, département, actif, email, noms).
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserDto, Error, { id: string; data: UpdateUserInput }>({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

/**
 * Hook pour activer/désactiver un utilisateur.
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation<UserDto, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => toggleUserActive(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

/**
 * Hook pour déclencher une réinitialisation de mot de passe.
 */
export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}
