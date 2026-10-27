/**
 * NotificationBell - Cloche de notifications avec compteur en direct.
 *
 * Affiche une icône de cloche avec un badge de compteur (non lus).
 * Au clic, ouvre un menu déroulant listant les notifications récentes avec
 * possibilité de les marquer lues individuellement ou toutes à la fois.
 * Une connexion SSE met à jour le compteur en temps réel.
 */

'use client';

import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, notificationsKeys } from '@/hooks/use-notifications';
import { messages } from '@/lib/messages/fr';
import { useToast } from '@/components/ui/use-toast';
import { NotificationItem } from './NotificationItem';

export function NotificationBell() {
  const { data, isLoading } = useNotifications({ lu: 'false', limit: 10 });
  const unread = data?.unread ?? 0;
  const notifications = data?.data ?? [];
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Connexion SSE : invalide la liste et le compteur à chaque événement NEW/READ.
  useEffect(() => {
    const es = new EventSource('/notifications/events');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW' || payload.type === 'READ') {
          queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        }
      } catch {
        // Message SSE mal formé, ignoré.
      }
    };
    return () => {
      es.close();
    };
  }, [queryClient]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
      toast({
        title: messages.notificationMarquerLu,
      });
    } catch {
      toast({
        title: messages.notificationErreurLecture,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast({
        title: messages.notificationMarquerTousLus,
      });
    } catch {
      toast({
        title: messages.notificationErreurLecture,
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          className="relative p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          aria-label={messages.bellLabel}
          aria-haspopup="true"
          aria-expanded={undefined}
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold shadow-md ring-1 ring-zinc-50 dark:ring-zinc-900"
              aria-label={`${unread} ${messages.notificationCompteur.replace('{count}', String(unread))}`}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <DropdownMenuLabel className="px-3 py-2">
          {messages.notifications}
          {unread > 0 && (
            <span className="ml-auto text-xs font-medium text-red-600 dark:text-red-400">
              {unread} {messages.notificationCompteur.replace('{count}', String(unread))}
            </span>
          )}
        </DropdownMenuLabel>
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            {messages.notificationChargement}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {messages.notificationsAucune}
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="px-2 py-1.5" onSelect={() => handleMarkAsRead(n.id)}>
                <NotificationItem notification={n} />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="px-3 py-2 text-sm text-red-600 dark:text-red-400"
              onSelect={handleMarkAllAsRead}
            >
              {messages.notificationMarquerTousLus}
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
