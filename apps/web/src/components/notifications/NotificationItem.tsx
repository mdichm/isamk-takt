/**
 * NotificationItem - Une ligne de notification dans la liste.
 *
 * Affiche le titre, l'état de lecture, la date et un lien vers l'objet
 * concerné (champ `lien` du DTO backend).
 */

'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';
import type { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const lu = notification.lu;
  const date = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleClick = () => {
    if (notification.lien) {
      router.push(notification.lien);
    }
  };

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-md border border-transparent transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
        lu ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-zinc-100 dark:bg-zinc-800'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && notification.lien) {
          router.push(notification.lien);
        }
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px]">
        {!lu ? (
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
        )}
        <span className="text-zinc-500 dark:text-zinc-400">{date}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {notification.titre}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {notification.evenement}
        </div>
      </div>
      <Badge variant={lu ? 'secondary' : 'default'} className="text-[10px]">
        {lu ? messages.notificationMarquerLu : 'Non lu'}
      </Badge>
    </div>
  );
}
