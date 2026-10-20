'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCreneaux } from '@/hooks/use-creneaux';
import { useCreneauxAffichage } from '@/hooks/use-ramadan';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { RamadanFormDialog } from './RamadanFormDialog';
import { RamadanDuplicateDialog } from './RamadanDuplicateDialog';
import { RamadanApercu } from './RamadanApercu';

const JOURS: { value: string; label: string }[] = [
  { value: 'LUNDI', label: messages.jourLundi },
  { value: 'MARDI', label: messages.jourMardi },
  { value: 'MERCREDI', label: messages.jourMercredi },
  { value: 'JEUDI', label: messages.jourJeudi },
  { value: 'VENDREDI', label: messages.jourVendredi },
  { value: 'SAMEDI', label: messages.jourSamedi },
];

interface RamadanGrilleProps {
  semestreId: string;
}

export function RamadanGrille({ semestreId }: RamadanGrilleProps) {
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

  // Indexer les créneaux par (jour, ordre)
  const creneauMap = new Map<string, typeof creneaux[number]>();
  creneaux.forEach((c) => {
    creneauMap.set(`${c.jour}|${c.ordre}`, c);
  });

  // Indexer les affichages Ramadan par creneauId
  const affichageMap = new Map<string, typeof affichages[number]>();
  affichages.forEach((a) => {
    affichageMap.set(a.creneauId, a);
  });

  // Déterminer le nombre maximal d'ordres
  const maxOrdre = Math.max(0, ...creneaux.map((c) => c.ordre));

  const [formOpen, setFormOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [apercuOpen, setApercuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  if (isPending) {
    return (
      <div className="p-4 text-muted-foreground">
        {messages.loading}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.ramadan}</h1>
          <p className="text-muted-foreground">{messages.ramadanSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setApercuOpen(true)}>
            {messages.btnApercu}
          </Button>
          <Button onClick={() => setDuplicateOpen(true)}>
            {messages.btnDupliquerRamadan}
          </Button>
          <Button onClick={() => { setEditingId(undefined); setFormOpen(true); }}>
            {messages.create} {messages.ramadan.toLowerCase()}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-24">{messages.columnJour}</TableHeader>
              {Array.from({ length: maxOrdre }, (_, i) => i + 1).map((ordre) => (
                <TableHeader key={ordre} className="text-center w-20">
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
                            <button
                              onClick={() => { setEditingId(a.id); setFormOpen(true); }}
                              className="text-xs text-primary hover:underline"
                              title={messages.editRamadan}
                            >
                              {messages.edit}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-1">
                            <Badge variant="outline" className="w-full text-xs">
                              {messages.grilleNormale}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {c.heureDebut.slice(0, 5)} - {c.heureFin.slice(0, 5)}
                            </span>
                            <button
                              onClick={() => { setEditingId(undefined); setFormOpen(true); }}
                              className="text-xs text-primary hover:underline"
                              title={messages.createRamadan}
                            >
                              +
                            </button>
                          </div>
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

      {creneaux.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          {messages.noRamadanAffichage}
        </div>
      )}

      <RamadanFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        creneauAffichageToEdit={editingId ? affichages.find((a) => a.id === editingId) : undefined}
      />
      <RamadanDuplicateDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} />
      <RamadanApercu open={apercuOpen} onOpenChange={setApercuOpen} semestreId={semestreId} />
    </div>
  );
}

