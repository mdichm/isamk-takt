/**
 * NotificationPage - Page complète de la boîte de réception des notifications.
 *
 * Liste paginée des notifications avec compteur de non lus, marquage lu
 * unitaire et global, et liens vers les ressources concernées.
 */

'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  notificationsKeys,
} from '@/hooks/use-notifications';
import type { NotificationQuery } from '@/lib/api/notifications';
import { messages } from '@/lib/messages/fr';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, Bell } from 'lucide-react';

export function NotificationPage() {
  const [query, setQuery] = useState<NotificationQuery>({});
  const { data, isLoading } = useNotifications(query);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const notifications = data?.data ?? [];
  const unread = data?.unread ?? 0;
  const nextCursor = data?.nextCursor ?? null;

  // SSE : recharge la liste et le compteur en direct.
  useEffect(() => {
    const es = new EventSource('/notifications/events');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW' || payload.type === 'READ') {
          queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
        }
      } catch {
        // Ignoré.
      }
    };
    return () => es.close();
  }, [queryClient]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
      toast({ title: messages.notificationMarquerLu });
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
      toast({ title: messages.notificationMarquerTousLus });
    } catch {
      toast({
        title: messages.notificationErreurLecture,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (iso: Date | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setQuery((prev: NotificationQuery) => ({
      ...prev,
      cursor: nextCursor,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-zinc-500" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {messages.notifications}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {messages.notificationsAucune}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={unread > 0 ? 'default' : 'secondary'}>
            {unread} {messages.notificationCompteur.replace('{count}', String(unread))}
          </Badge>
          {unread > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {messages.notificationMarquerTousLus}
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-10 text-xs text-zinc-500 dark:text-zinc-400">
          {messages.notificationChargement}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 mb-3">
            <Mail className="w-6 h-6 text-zinc-400" />
          </div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {messages.notificationVide}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Aucune notification pour le moment.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">{messages.notificationNouvelle}</TableHead>
                <TableHead>{messages.notificationMarquerLu}</TableHead>
                <TableHead className="text-right">{messages.notificationVoir}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow
                  key={n.id}
                  className={`cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    n.lu ? '' : 'bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500'
                  }`}
                  onClick={() => {
                    if (n.lien) {
                      window.location.assign(n.lien);
                    }
                  }}
                >
                  <TableCell className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {n.titre}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-1 text-xs">
                      {!n.lu && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                      {formatDate(n.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {!n.lu && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        {messages.notificationMarquerLu}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {nextCursor && (
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                size="sm"
                onClick={handleLoadMore}
                disabled={markAsRead.isPending || markAllAsRead.isPending}
              >
                <Clock className="w-3 h-3 mr-2" />
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

