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
  useContraintesInstances, useDeleteContrainteInstance,
} from '@/hooks/use-contraintes';
import { messages } from '@/lib/messages/fr';
import { ContrainteInstance, ContraintesQuery } from '@/lib/api/contraintes';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

export function ContraintesTable() {
  const [query, setQuery] = useState<ContraintesQuery>({
    page: 1, limit: 10,
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isPending, error } = useContraintesInstances(query);
  const deleteMutation = useDeleteContrainteInstance();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadContraintesInstances,
      variant: 'destructive',
    });
  }

  const instances = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDelete = (i: ContrainteInstance) => {
    setDeleteId(i.id);
    setDeleteName(i.definitionId);
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
          <h1 className="text-2xl font-bold">{messages.contraintes}</h1>
          <p className="text-muted-foreground">
            {messages.contraintesSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.search}</Label>
          <Input
            value={query.search ?? ''}
            onChange={(e) => setQuery({ ...query, page: 1, search: e.target.value as string })}
            placeholder={messages.searchPlaceholder ?? 'Rechercher une contrainte…'}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.etat}</Label>
          <Select
            value={query.actif === true ? 'true' : query.actif === false ? 'false' : ''}
            onValueChange={(v) => setQuery({
              ...query, page: 1,
              actif: v === 'true' ? true : v === 'false' ? false : undefined,
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
          <Label className="text-xs font-medium">{messages.labelNature}</Label>
          <Select
            value={query.nature ?? ''}
            onValueChange={(v) => setQuery({ ...query, page: 1, nature: (v === 'REGLE' || v === 'VOEU') ? v : undefined })}
          >
            <SelectTrigger className="w-32"><SelectValue placeholder={messages.formSelectNature} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="REGLE">{messages.natureRegle}</SelectItem>
              <SelectItem value="VOEU">{messages.natureVoeu}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-20">{messages.columnLibelle}</TableHeader>
              <TableHeader>{messages.columnCode}</TableHeader>
              <TableHeader className="w-24">{messages.columnCategorie}</TableHeader>
              <TableHeader className="w-24">{messages.columnPortee}</TableHeader>
              <TableHeader className="w-20">{messages.columnNature}</TableHeader>
              <TableHeader className="w-20">{messages.columnPoids}</TableHeader>
              <TableHeader className="w-24">{messages.columnFetSupport}</TableHeader>
              <TableHeader className="w-20">{messages.columnActif}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {messages.noContraintesInstances}
                </TableCell>
              </TableRow>
            ) : (
              instances.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.definitionId}</TableCell>
                  <TableCell>{i.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.nature === 'REGLE' ? messages.natureRegle : messages.natureVoeu}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={i.poids !== undefined ? 'default' : 'secondary'}>
                      {i.poids !== undefined ? i.poids : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.actif ? 'default' : 'secondary'}>
                      {i.actif ? messages.active : messages.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleDelete(i)} disabled={deleteMutation.isPending}>
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
            <DialogTitle>{messages.deleteContrainteInstance}</DialogTitle>
            <DialogDescription>
              {messages.deleteContrainteInstanceConfirm.replace('{name}', deleteName)}
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