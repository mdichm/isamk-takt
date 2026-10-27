import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type PaginatedNotifications,
  type NotificationQuery,
} from '@/lib/api/notifications';
import { getErrorMessage } from '@/lib/api/errors';

/**
 * Clés de cache React Query pour les notifications.
 * Le SSE invalide `all` (liste + compteur non lus) à chaque événement.
 */
export const notificationsKeys = {
  all: ['notifications'] as const,
  list: (query: NotificationQuery) =>
    [...notificationsKeys.all, 'list', query] as const,
};

/**
 * Hook pour récupérer la liste paginée des notifications de l'utilisateur connecté.
 */
export function useNotifications(query: NotificationQuery = {}) {
  return useQuery<PaginatedNotifications, Error>({
    queryKey: notificationsKeys.list(query),
    queryFn: () => listNotifications(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour marquer une notification comme lue.
 * Invalide la liste et le compteur non lus en cas de succès.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<Notification, Error, string>({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

/**
 * Hook pour marquer toutes les notifications comme lues.
 * Invalide la liste et le compteur non lus en cas de succès.
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<{ count: number }, Error, void>({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}
