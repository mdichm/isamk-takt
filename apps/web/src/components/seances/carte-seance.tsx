'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback } from 'react';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';

export interface SeanceCarte {
  id: string;
  jour?: string;
  creneauDebutId?: string;
  salleId?: string | null;
  enseignantId?: string | null;
  statut: string;
  nbCreneaux: number;
  revision: number;
}

type EtatSeance = 'IVORY' | 'WARM' | 'INSET';

interface CarteSeanceProps {
  seance: SeanceCarte;
  etat: EtatSeance;
  index: number;
  editable: boolean;
  onMove: (seanceId: string, jour: string, creneauDebutId: string, salleId: string, revision: number) => void;
}

function etatConfig(etat: EtatSeance) {
  switch (etat) {
    case 'IVORY':
      return {
        badge: 'badge-outline',
        label: messages.etatIvory,
        icon: MapPin,
        couleur: 'border-[color:#29363C] text-[color:#29363C] bg-[color:#29363C]/10',
      };
    case 'WARM':
      return {
        badge: 'badge-outline',
        label: messages.etatWarm,
        icon: AlertCircle,
        couleur: 'border-[color:#B45309] text-[color:#B45309] bg-[color:#B45309]/10',
      };
    case 'INSET':
      return {
        badge: 'badge-outline',
        label: messages.etatInset,
        icon: AlertCircle,
        couleur: 'border-[color:#B45309] text-[color:#B45309] bg-[color:#B45309]/10',
      };
    default:
      return {
        badge: 'badge-outline',
        label: messages.etatIvory,
        icon: MapPin,
        couleur: 'border-[color:#29363C] text-[color:#29363C] bg-[color:#29363C]/10',
      };
  }
}

export function CarteSeance({
  seance,
  etat,
  index,
  editable,
  onMove,
}: CarteSeanceProps) {
  const config = etatConfig(etat);

  const { attributes, listeners, transform, transition } = useSortable({
    id: seance.id,
    data: {
      seanceId: seance.id,
      jour: seance.jour,
      creneauDebutId: seance.creneauDebutId,
      salleId: seance.salleId ?? '',
      revision: seance.revision,
    },
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const Icon = config.icon;

  const estNonPlacee = !seance.salleId || seance.statut === 'NON_PLACEE';

  const handleClick = useCallback(() => {
    if (!editable || estNonPlacee) return;
    onMove(
      seance.id,
      seance.jour!,
      seance.creneauDebutId!,
      seance.salleId ?? '',
      seance.revision,
    );
  }, [editable, estNonPlacee, seance, onMove]);

  return (
    <div
      {...attributes}
      {...listeners}
      onClick={handleClick}
      style={style}
      className={
        'relative rounded border p-2 cursor-grab active:cursor-grabbing transition-all ' +
        (editable && !estNonPlacee ? 'hover:shadow-sm' : 'opacity-50 cursor-not-allowed') +
        ' ' +
        config.couleur +
        (index % 2 === 0 ? '' : ' bg-muted/30')
      }
      title={config.label}
      aria-label={config.label}
    >
      <div className="flex items-start gap-1.5">
        <div className="mt-0.5 text-[color:#29363C]">
          <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[color:#29363C] truncate">
            {seance.jour} · {seance.creneauDebutId}
          </div>
          {seance.salleId && (
            <div className="text-xs text-muted-foreground truncate">
              Salle {seance.salleId}
            </div>
          )}
          {estNonPlacee && (
            <div className="text-[color:#B45309] text-xs font-medium">
              {messages.nonPlacee}
            </div>
          )}
        </div>
        <Badge variant={config.badge === 'badge-outline' ? 'outline' : 'secondary'} className="text-xs shrink-0">
          {config.label}
        </Badge>
      </div>
      {!editable && (
        <div className="absolute top-1 right-1 opacity-60 hover:opacity-100">
          <Clock className="h-3 w-3" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
