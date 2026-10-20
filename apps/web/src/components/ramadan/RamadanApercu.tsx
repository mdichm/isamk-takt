'use client';

import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCreneaux } from '@/hooks/use-creneaux';
import { useCreneauxAffichage } from '@/hooks/use-ramadan';
import { messages } from '@/lib/messages/fr';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const JOURS: { value: string; label: string }[] = [
  { value: 'LUNDI', label: messages.jourLundi },
  { value: 'MARDI', label: messages.jourMardi },
  { value: 'MERCREDI', label: messages.jourMercredi },
  { value: 'JEUDI', label: messages.jourJeudi },
  { value: 'VENDREDI', label: messages.jourVendredi },
  { value: 'SAMEDI', label: messages.jourSamedi },
];

interface RamadanApercuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semestreId: string;
}

export function RamadanApercu({ open, onOpenChange, semestreId }: RamadanApercuProps) {
  const { data, isPending } = useCreneaux({
    semestreId,
    limit: 100,
    estActive: true,
  });
  const { data: affichageData } = useCreneauxAffichage({
    semestreId,
    grille: 'RAMADAN',
    limit: 100,
  });

  const creneaux = data?.data ?? [];
  const affichages = affichageData?.data ?? [];

  const creneauMap = new Map<string, typeof creneaux[number]>();
  creneaux.forEach((c) => {
    creneauMap.set(`${c.jour}|${c.ordre}`, c);
  });

  const affichageMap = new Map<string, typeof affichages[number]>();
  affichages.forEach((a) => {
    affichageMap.set(a.creneauId, a);
  });

  const maxOrdre = Math.max(0, ...creneaux.map((c) => c.ordre));

  if (isPending) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{messages.apercuTitre}</DialogTitle>
          <DialogDescription>{messages.ramadanSubtitle}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{messages.apercuNormale}</h3>
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
                                  {c.heureDebut.slice(0, 5)} - {c.heureFin.slice(0, 5)}
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
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{messages.apercuRamadan}</h3>
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
                        const a = c ? affichageMap.get(c.id) : undefined;
                        return (
                          <TableCell key={ordre} className="text-center h-12">
                            {c ? (
                              a ? (
                                <div className="flex flex-col items-center justify-center h-full gap-1">
                                  <Badge variant="secondary" className="w-full text-xs">
                                    {messages.grilleRamadan}
                                  </Badge>
                                  <span className="text-sm font-mono">
                                    {a.heureDebut.slice(0, 5)} - {a.heureFin.slice(0, 5)}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="w-full text-xs">
                                  {messages.grilleNormale}
                                </Badge>
                              )
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
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{messages.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
