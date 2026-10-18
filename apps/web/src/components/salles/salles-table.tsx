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
  useSalles, useDeleteSalle,
} from '@/hooks/use-salles';
import { messages } from '@/lib/messages/fr';
import { Salle, SallesQuery } from '@/lib/api/salles';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

export function SallesTable() {
  const [query, setQuery] = useState<SallesQuery>({
    page: 1, limit: 10,
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isPending, error } = useSalles(query);
  const deleteMutation = useDeleteSalle();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadSalles,
      variant: 'destructive',
    });
  }

  const salles = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDelete = (s: Salle) => {
    setDeleteId(s.id);
    setDeleteName(s.code);
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
          <h1 className="text-2xl font-bold">{messages.salles}</h1>
          <p className="text-muted-foreground">
            {messages.sallesSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.search}</Label>
          <Input
            value={query.search ?? ''}
            onChange={(e) => setQuery({ ...query, page: 1, search: e.target.value })}
            placeholder={messages.searchPlaceholder ?? 'Rechercher une salle…'}
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
          <Label className="text-xs font-medium">{messages.columnPMR}</Label>
          <Select
            value={query.accesPMR === true ? 'true' : query.accesPMR === false ? 'false' : ''}
            onValueChange={(v) => setQuery({
              ...query, page: 1,
              accesPMR: v === 'true' ? true : v === 'false' ? false : undefined,
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

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-20">{messages.columnCode}</TableHeader>
              <TableHeader>{messages.columnLibelle}</TableHeader>
              <TableHeader>{messages.columnSite}</TableHeader>
              <TableHeader>{messages.columnTypeSalle}</TableHeader>
              <TableHeader className="text-right">{messages.columnCapacite}</TableHeader>
              <TableHeader className="text-center">{messages.columnPMR}</TableHeader>
              <TableHeader>{messages.etat}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {messages.noSalles}
                </TableCell>
              </TableRow>
            ) : (
              salles.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.code}</TableCell>
                  <TableCell>{s.libelle}</TableCell>
                  <TableCell>{s.siteId ?? '—'}</TableCell>
                  <TableCell>{s.typeSalleId ?? '—'}</TableCell>
                  <TableCell className="text-right">{s.capaciteMax}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={s.accesPMR ? 'default' : 'secondary'}>
                      {s.accesPMR ? messages.active : messages.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.estActive ? 'default' : 'secondary'}>
                      {s.estActive ? messages.active : messages.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleDelete(s)} disabled={deleteMutation.isPending}>
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
            <DialogTitle>{messages.deleteSalle}</DialogTitle>
            <DialogDescription>
              {messages.deleteSalleConfirm.replace('{name}', deleteName)}
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
