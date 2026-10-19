'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useCreneaux, useDeleteCreneau,
} from '@/hooks/use-creneaux';
import { messages } from '@/lib/messages/fr';
import { Creneau, CreneauQuery } from '@/lib/api/creneaux';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

const JOURS: { value: string; label: string }[] = [
  { value: 'LUNDI', label: messages.jourLundi },
  { value: 'MARDI', label: messages.jourMardi },
  { value: 'MERCREDI', label: messages.jourMercredi },
  { value: 'JEUDI', label: messages.jourJeudi },
  { value: 'VENDREDI', label: messages.jourVendredi },
  { value: 'SAMEDI', label: messages.jourSamedi },
];

export function CreneauxTable() {
  const [query, setQuery] = useState<CreneauQuery>({
    page: 1, limit: 10,
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteRef, setDeleteRef] = useState('');

  const { data, isPending, error } = useCreneaux(query);
  const deleteMutation = useDeleteCreneau();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadCreneaux,
      variant: 'destructive',
    });
  }

  const creneaux = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDelete = (c: Creneau) => {
    setDeleteId(c.id);
    setDeleteRef(`${c.jour} #${c.ordre}`);
    setOpenDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setOpenDelete(false);
    setDeleteId(null);
    setDeleteRef('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.creneaux}</h1>
          <p className="text-muted-foreground">{messages.creneauxSubtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.search}</Label>
          <Input
            value={query.semestreId ?? ''}
            onChange={(e) => setQuery({ ...query, page: 1, semestreId: e.target.value })}
            placeholder={messages.formSelectSemestre}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.etat}</Label>
          <Select
            value={query.estActive === true ? 'true' : query.estActive === false ? 'false' : ''}
            onValueChange={(v) => setQuery({
              ...query, page: 1,
              estActive: v === 'true' ? true : v === 'false' ? false : undefined,
            })}
          >
            <SelectTrigger className="w-32"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{messages.active}</SelectItem>
              <SelectItem value="false">{messages.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.columnEstPause}</Label>
          <Select
            value={query.estPause === true ? 'true' : query.estPause === false ? 'false' : ''}
            onValueChange={(v) => setQuery({
              ...query, page: 1,
              estPause: v === 'true' ? true : v === 'false' ? false : undefined,
            })}
          >
            <SelectTrigger className="w-32"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{messages.active}</SelectItem>
              <SelectItem value="false">{messages.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader>{messages.columnJour}</TableHeader>
              <TableHeader>{messages.columnOrdre}</TableHeader>
              <TableHeader>{messages.columnHeureDebut}</TableHeader>
              <TableHeader>{messages.columnHeureFin}</TableHeader>
              <TableHeader>{messages.columnEstPause}</TableHeader>
              <TableHeader>{messages.columnEstActive}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creneaux.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {messages.noCreneaux}
                </TableCell>
              </TableRow>
            ) : (
              creneaux.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {JOURS.find((j) => j.value === c.jour)?.label ?? c.jour}
                  </TableCell>
                  <TableCell>{c.ordre}</TableCell>
                  <TableCell>{c.heureDebut}</TableCell>
                  <TableCell>{c.heureFin}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.estPause ? 'destructive' : 'secondary'}>
                      {c.estPause ? messages.pause : messages.cours}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.estActive ? 'default' : 'secondary'}>
                      {c.estActive ? messages.active : messages.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleDelete(c)} disabled={deleteMutation.isPending}>
                      <Trash2 size={14} className="mr-1" />
                      {messages.btnSupprimer}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={(query.page ?? 1) === 1 || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}
            >Précédent</Button>
            <span className="text-xs text-muted-foreground">
              {query.page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={(query.page ?? 1) >= totalPages || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}
            >Suivant</Button>
          </div>
        </div>
      )}

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.deleteCreneau}</DialogTitle>
            <DialogDescription>
              {messages.deleteCreneauConfirm.replace('{name}', deleteRef)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDelete(false)} disabled={deleteMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending ? messages.loading : messages.btnSupprimer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}