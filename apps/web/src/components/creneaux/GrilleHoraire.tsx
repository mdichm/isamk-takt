'use client';

import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCreneaux } from '@/hooks/use-creneaux';
import { messages } from '@/lib/messages/fr';
import { Creneau } from '@/lib/api/creneaux';

const JOURS: { value: string; label: string }[] = [
  { value: 'LUNDI', label: messages.jourLundi },
  { value: 'MARDI', label: messages.jourMardi },
  { value: 'MERCREDI', label: messages.jourMercredi },
  { value: 'JEUDI', label: messages.jourJeudi },
  { value: 'VENDREDI', label: messages.jourVendredi },
  { value: 'SAMEDI', label: messages.jourSamedi },
];

interface GrilleHoraireProps {
  semestreId: string;
}

export function GrilleHoraire({ semestreId }: GrilleHoraireProps) {
  const { data, isPending } = useCreneaux({
    semestreId,
    limit: 100,
    estActive: true,
  });

  const creneaux = data?.data ?? [];

  // Indexer les créneaux par (jour, ordre)
  const creneauMap = new Map<string, Creneau>();
  creneaux.forEach((c) => {
    creneauMap.set(`${c.jour}|${c.ordre}`, c);
  });

  // Déterminer le nombre maximal d'ordres
  const maxOrdre = Math.max(0, ...creneaux.map((c) => c.ordre));

  if (isPending) {
    return (
      <div className="p-4 text-muted-foreground">
        {messages.loading}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-24">{messages.columnJour}</TableHeader>
              {Array.from({ length: maxOrdre }, (_, i) => i + 1).map((ordre) => (
                <TableHeader key={ordre} className="text-center w-16">
                  #{ordre}
                </TableHeader>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {JOURS.map((jour) => (
              <TableRow key={jour.value}>
                <TableCell className="font-medium">{jour.label}</TableCell>
                {Array.from({ length: maxOrdre }, (_, i) => i + 1).map((ordre) => {
                  const c = creneauMap.get(`${jour.value}|${ordre}`);
                  return (
                    <TableCell key={ordre} className="text-center h-12">
                      {c ? (
                        <Badge variant={c.estPause ? 'destructive' : 'secondary'} className="w-full">
                          {c.estPause ? messages.pause : messages.cours}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {c.heureDebut} - {c.heureFin}
                          </span>
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {creneaux.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          {messages.noCreneaux}
        </div>
      )}
    </div>
  );
}
