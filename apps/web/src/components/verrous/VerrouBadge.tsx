'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Building2, Lock, User, Activity } from 'lucide-react';
import { messages } from '@/lib/messages/fr';

type VerrouType = 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE';

const VERROU_CONFIG: Record<
  VerrouType,
  { icon: React.ElementType; label: string; aria: string }
> = {
  CRENEAU: {
    icon: Lock,
    label: messages.verrouCreneau,
    aria: 'Verrouillé sur le créneau — non modifiable',
  },
  SALLE: {
    icon: Building2,
    label: messages.verrouSalle,
    aria: 'Verrouillé sur la salle — non modifiable',
  },
  ENSEIGNANT: {
    icon: User,
    label: messages.verrouEnseignant,
    aria: 'Verrouillé sur l’enseignant — non modifiable',
  },
  ACTIVITE: {
    icon: Activity,
    label: messages.verrouActivite,
    aria: 'Activité figée — non modifiable',
  },
};

interface VerrouBadgeProps {
  type: VerrouType;
  size?: 'sm' | 'default';
}

export function VerrouBadge({ type, size = 'default' }: VerrouBadgeProps) {
  const config = VERROU_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-[color:#29363C] text-[color:#29363C] bg-[color:#29363C]/10',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm',
      )}
      aria-label={config.aria}
      title={config.label}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
      {config.label}
    </Badge>
  );
}
