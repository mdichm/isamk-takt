'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { messages } from '@/lib/messages/fr';
import { VerrouSeance } from '@/lib/api/verrous';

interface VerrouHistoriqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verrous: VerrouSeance[];
}

export function VerrouHistoriqueDialog({
  open,
  onOpenChange,
  verrous,
}: VerrouHistoriqueDialogProps) {
  const actif = verrous.filter((v) => !v.leveLe);
  const leve = verrous.filter((v) => !!v.leveLe);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.verrouHistorique}</DialogTitle>
          <DialogDescription>
            {verrous.length === 0
              ? messages.verrouHistoriqueVide
              : `${verrous.length} verrou${
                  verrous.length > 1 ? 'x' : ''
                } dans l’historique`}
          </DialogDescription>
        </DialogHeader>

        {actif.length > 0 && (
          <section className="mb-4">
            <h3 className="text-sm font-semibold mb-2">{messages.verrouActif}</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Posé par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHead>
              <TableBody>
                {actif.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.type}</TableCell>
                    <TableCell>{v.auteurId}</TableCell>
                    <TableCell>{formatDate(v.creeLe)}</TableCell>
                    <TableCell>
                      {v.justification ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {leve.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-2">{messages.verrouLeve}</h3>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Levé par</TableHead>
                  <TableHead>Date levée</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHead>
              <TableBody>
                {leve.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.type}</TableCell>
                    <TableCell>{v.levePar ?? '—'}</TableCell>
                    <TableCell>{v.leveLe ? formatDate(v.leveLe) : '—'}</TableCell>
                    <TableCell>
                      {v.justification ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {messages.btnFermer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
