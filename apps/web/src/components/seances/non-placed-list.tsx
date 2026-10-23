'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { MapPin, MapPinOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenEtat, type EtatSeance } from './token-etat';
import { messages } from '@/lib/messages/fr';

interface NonPlacedSeanceCardProps {
  seance: {
    id: string;
    jour?: string | null;
    creneauDebutId?: string | null;
    salleId?: string | null;
    enseignantId?: string | null;
    statut: string;
    nbCreneaux: number;
    revision: number;
  };
  etat: EtatSeance;
  onSelect: (id: string) => void;
  onMove: (
    seanceId: string,
    jour: string,
    creneauDebutId: string,
    salleId: string,
    revision: number,
  ) => void;
}

function NonPlacedSeanceCard({
  seance,
  etat,
  onSelect,
  onMove,
}: NonPlacedSeanceCardProps) {
  const { attributes, listeners, transform, transition } = useSortable({
    id: seance.id,
    data: {
      seanceId: seance.id,
      jour: seance.jour ?? '',
      creneauDebutId: seance.creneauDebutId ?? '',
      salleId: seance.salleId ?? '',
      revision: seance.revision,
    },
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const estNonPlacee = !seance.salleId || seance.statut === 'NON_PLACEE';

  return (
    <Card
      {...attributes}
      {...listeners}
      onClick={() => onSelect(seance.id)}
      style={style}
      className={
        'relative rounded border p-3 cursor-grab active:cursor-grabbing transition-all ' +
        (estNonPlacee ? 'opacity-70 cursor-not-allowed border-dashed' : 'hover:shadow-sm') +
        ' bg-muted/30'
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-1">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="text-sm font-medium text-[color:#29363C] truncate">
            {seance.jour} · {seance.creneauDebutId}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            Groupe(s) · {seance.nbCreneaux} créneau{seance.nbCreneaux > 1 ? 'x' : ''}
          </div>
          {estNonPlacee && (
            <div className="text-xs font-medium text-[color:#B45309] mt-0.5">
              {messages.nonPlacee}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TokenEtat etat={etat} estNonPlacee={estNonPlacee} />
          <Badge variant="outline" className="text-xs">
            Rev {seance.revision}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{seance.enseignantId ?? '—'}</span>
          <span>{seance.salleId ?? messages.aPlacer}</span>
        </div>
        <Button size="sm" onClick={() => onMove(seance.id, seance.jour!, seance.creneauDebutId!, seance.salleId!, seance.revision)}>
          Appliquer
        </Button>
      </CardContent>
      {!estNonPlacee && (
        <div className="absolute top-1 right-1 opacity-60 hover:opacity-100">
          <MapPin className="h-3 w-3" aria-hidden="true" />
        </div>
      )}
      {estNonPlacee && (
        <div className="absolute top-1 right-1 opacity-60 hover:opacity-100">
          <MapPinOff className="h-3 w-3 text-[color:#B45309]" aria-hidden="true" />
        </div>
      )}
    </Card>
  );
}

interface NonPlacedListProps {
  seances: NonPlacedSeanceCardProps['seance'][];
  etat: EtatSeance;
  onSelect: (id: string) => void;
  onMove: (
    seanceId: string,
    jour: string,
    creneauDebutId: string,
    salleId: string,
    revision: number,
  ) => void;
}

export function NonPlacedList({
  seances,
  etat,
  onSelect,
  onMove,
}: NonPlacedListProps) {
  const nonPlacees = seances.filter(
    (s) => !s.salleId || s.statut === 'NON_PLACEE',
  );

  if (nonPlacees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{messages.nonPlaceeTitre}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          {nonPlacees.map((s) => (
            <NonPlacedSeanceCard
              key={s.id}
              seance={s}
              etat={etat}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}