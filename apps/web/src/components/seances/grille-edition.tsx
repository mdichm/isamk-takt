'use client';

import {
  DndContext,
  useSensor,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';
import { Grid2X2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SelecteurGrille } from './selecteur-grille';
import { CarteSeance } from './carte-seance';
import { useGrilleState } from '@/hooks/use-grille-state';
import { useMoveSeance } from '@/hooks/use-seances';
import { messages } from '@/lib/messages/fr';

type ModeGrille = 'NORMALE' | 'RAMADAN';

interface GrilleEditionProps {
  versionId: string;
  modeInitial?: ModeGrille;
  editable?: boolean;
}

export function GrilleEdition({
  versionId,
  modeInitial = 'NORMALE',
  editable = true,
}: GrilleEditionProps) {
  const { seances, total, isLoading, error, jours, etatSeance, seancesParCreneau, editable: estEditable } =
    useGrilleState(versionId, modeInitial, editable);
  const [modeGrille, setModeGrille] = useState<ModeGrille>(modeInitial);
  const move = useMoveSeance();

  const sensors = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !estEditable) return;

      const seance = seances.find((s) => s.id === active.id);
      if (!seance || !seance.salleId) return;

      const cible = seancesParCreneau.get(String(over.id));
      const cibleSeance = cible?.[0];
      if (!cibleSeance?.salleId) return;

      try {
        await move.mutateAsync({
          seanceId: seance.id,
          dto: {
            jour: cibleSeance.jour!,
            creneauDebutId: cibleSeance.creneauDebutId!,
            salleId: cibleSeance.salleId!,
          },
          ifMatch: String(seance.revision),
          versionId,
        });
      } catch {
        // Le toast d'erreur est déjà émis par le hook useMoveSeance
      }
    },
    [seances, seancesParCreneau, estEditable, move, versionId],
  );

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <CardContent>{messages.loading}</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <CardContent>{messages.errorGeneric}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Grid2X2 className="h-4 w-4" />
            {messages.grille}
          </CardTitle>
          <div className="flex items-center gap-2">
            <SelecteurGrille mode={modeGrille} onChange={setModeGrille} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>{total} séance{total > 1 ? 's' : ''}</span>
            {!estEditable && (
              <span className="flex items-center gap-1 text-xs font-medium text-[color:#B45309]">
                <Lock className="h-3 w-3" aria-hidden="true" />
                {messages.grilleLectureSeule}
              </span>
            )}
          </div>
          <div className="overflow-x-auto max-h-[70vh]">
            <DndContext sensors={[sensors]} onDragEnd={handleDragEnd}>
              <SortableContext items={seances.map((s) => s.id)}>
                <ScrollArea className="max-h-[60vh] w-full">
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-1">
                    <div className="font-medium text-muted-foreground text-xs">
                      {messages.colonneJour}
                    </div>
                    {jours.map((j) => (
                      <div key={j} className="text-center font-medium text-muted-foreground text-xs uppercase">
                        {j.charAt(0)}
                      </div>
                    ))}
                    {seances.map((s, i) => {
                      const etat = etatSeance(s);
                      return (
                        <CarteSeance
                          key={s.id}
                          seance={s}
                          etat={etat}
                          index={i}
                          editable={estEditable && etat === 'IVORY'}
                          onMove={(id, jour, creneau, salleId, rev) =>
                            move.mutate({
                              seanceId: id,
                              dto: { jour, creneauDebutId: creneau, salleId },
                              ifMatch: String(rev),
                              versionId,
                            })
                          }
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
