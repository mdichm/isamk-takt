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
  useEnseignants, useDeleteEnseignant,
} from '@/hooks/use-enseignants';
import { messages } from '@/lib/messages/fr';
import { EnseignantsQuery, Enseignant } from '@/lib/api/enseignants';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

function nomComplet(e: Enseignant) {
  return `${e.prenom} ${e.nom}`;
}

export function EnseignantsTable() {
  const [query, setQuery] = useState<EnseignantsQuery>({
    page: 1, limit: 10,
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isPending, error } = useEnseignants(query);
  const deleteMutation = useDeleteEnseignant();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadEnseignants,
      variant: 'destructive',
    });
  }

  const enseignants = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDelete = (e: Enseignant) => {
    setDeleteId(e.id);
    setDeleteName(nomComplet(e));
    setOpenDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setOpenDelete(false);
    setDeleteId(null);
    setDeleteName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.enseignants}</h1>
          <p className="text-muted-foreground">
            {messages.enseignantsSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.search}</Label>
          <Input
            value={query.search ?? ''}
            onChange={(e) => setQuery({ ...query, page: 1, search: e.target.value })}
            placeholder={messages.searchPlaceholder}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.etat}</Label>
          <Select
            value={query.isActive === true ? 'true' : query.isActive === false ? 'false' : ''}
            onValueChange={(v) => setQuery({ ...query, page: 1, isActive: v === 'true' ? true : v === 'false' ? false : undefined })}
          >
            <SelectTrigger className="w-32"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">{messages.tous}</SelectItem>
              <SelectItem value="true">{messages.active}</SelectItem>
              <SelectItem value="false">{messages.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background">
        {isPending && <div className="h-64 flex items-center justify-center">{messages.loading}</div>}
        {!isPending && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader>{messages.columnMatricule}</TableHeader>
                <TableHeader>{messages.columnNom}</TableHeader>
                <TableHeader>{messages.columnPrenom}</TableHeader>
                <TableHeader>{messages.email}</TableHeader>
                <TableHeader>{messages.columnTelephone}</TableHeader>
                <TableHeader>{messages.etat}</TableHeader>
                <TableHeader className="text-right">{messages.columnActions}</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enseignants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {messages.noEnseignants}
                  </TableCell>
                </TableRow>
              ) : (
                enseignants.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.matricule}</TableCell>
                    <TableCell>{e.nom}</TableCell>
                    <TableCell>{e.prenom}</TableCell>
                    <TableCell>{e.email}</TableCell>
                    <TableCell>{e.telephone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.isActive ? 'default' : 'secondary'}>
                        {e.isActive ? messages.active : messages.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleDelete(e)} disabled={deleteMutation.isPending}>
                        <Trash2 size={14} className="mr-1" />
                        {messages.btnSupprimer}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
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
            <DialogTitle>{messages.deleteEnseignant}</DialogTitle>
            <DialogDescription>
              {messages.deleteEnseignantConfirm.replace('{name}', deleteName)}
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