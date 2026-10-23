'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback } from 'react';
import { Clock, MapPinOff } from 'lucide-react';
import { TokenEtat } from './token-etat';
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

interface CarteSeanceProps {
  seance: SeanceCarte;
  etat: 'IVORY' | 'WARM' | 'INSET';
  index: number;
  editable: boolean;
  onClick?: (id: string) => void;
  onMove: (seanceId: string, jour: string, creneauDebutId: string, salleId: string, revision: number) => void;
}

export function CarteSeance({
  seance,
  etat,
  index,
  editable,
  onClick,
  onMove,
}: CarteSeanceProps) {
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
      onClick={() => {
        if (onClick) {
          onClick(seance.id);
        } else {
          handleClick();
        }
      }}
      style={style}
      className={
        'relative rounded border p-2 cursor-grab active:cursor-grabbing transition-all ' +
        (editable && !estNonPlacee ? 'hover:shadow-sm' : 'opacity-50 cursor-not-allowed') +
        (index % 2 === 0 ? '' : ' bg-muted/30')
      }
      title={messages.deplacerSeance}
      aria-label={messages.deplacerSeance}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex items-center gap-1.5">
          {estNonPlacee && (
            <MapPinOff className="h-3 w-3 text-[color:#B45309]" aria-hidden="true" />
          )}
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
        <TokenEtat etat={etat} estNonPlacee={estNonPlacee} />
      </div>
      {!editable && (
        <div className="absolute top-1 right-1 opacity-60 hover:opacity-100">
          <Clock className="h-3 w-3" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
