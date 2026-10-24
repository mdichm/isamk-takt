'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExigencesSalle, useDeleteExigenceSalle } from '@/hooks/use-exigences-salle';
import { messages } from '@/lib/messages/fr';
import { ExigenceSalleActivite, ExigenceSalleQuery } from '@/lib/api/exigences-salle';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

interface ExigencesSalleTableProps {
  semestreId: string;
  canWrite: boolean;
  onEdit?: (exigence: ExigenceSalleActivite) => void;
}

export function ExigencesSalleTable({ semestreId, canWrite, onEdit }: ExigencesSalleTableProps) {
  const [query, setQuery] = useState<ExigenceSalleQuery>({ page: 1, limit: 10, semestreId });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState('');

  const { data, isPending, error } = useExigencesSalle(query);
  const deleteMutation = useDeleteExigenceSalle();
  const { toast } = useToast();

  if (error) {
    toast({ title: messages.error, description: getErrorMessage(error) || messages.errorLoadExigencesSalle, variant: 'destructive' });
  }

  const exigences = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleDelete = (e: ExigenceSalleActivite) => { setDeleteId(e.id); setDeleteLabel(e.affectationKey); setOpenDelete(true); };
  const handleConfirmDelete = () => { if (!deleteId) return; deleteMutation.mutate(deleteId); setOpenDelete(false); setDeleteId(null); setDeleteLabel(''); };

  const sallesAutoriseesLabel = (e: ExigenceSalleActivite) => {
    if (e.salleImposeeId) return e.salleImposeeCode ?? e.salleImposeeId;
    if (e.autorisees.length > 0) return e.autorisees.map((a) => a.code ?? a.salleId).join(', ');
    return messages.aucuneContrainte;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.exigencesSalle}</h1>
          <p className="text-muted-foreground">{messages.exigencesSalleSubtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{messages.search}</Label>
          <Input value={query.search ?? ''} onChange={(e) => setQuery({ ...query, page: 1, search: e.target.value })} placeholder={messages.searchPlaceholder ?? 'Rechercher…'} className="w-64" />
        </div>
      </div>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">{messages.columnAffectationKey}</th>
              <th className="p-2">{messages.columnSalleImposee}</th>
              <th className="p-2">{messages.columnSallesAutorisees}</th>
              <th className="p-2">{messages.columnCapacite}</th>
              <th className="p-2">{messages.columnIncompatibles}</th>
              {canWrite && <th className="p-2">{messages.columnActions}</th>}
            </tr>
          </thead>
          <TableBody>
            {exigences.length === 0 ? (
              <tr><TableCell colSpan={canWrite ? 6 : 5} className="text-center py-8">{messages.noExigencesSalle}</TableCell></tr>
            ) : (
              exigences.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium truncate max-w-[160px]">{e.affectationKey}</td>
                  <td className="p-2 truncate max-w-[140px]">{e.salleImposeeCode ?? messages.aucuneContrainte}</td>
                  <td className="p-2 truncate max-w-[200px]">{sallesAutoriseesLabel(e)}</td>
                  <td className="p-2 text-right">—</td>
                  <td className="p-2"><Badge variant="secondary" className="text-xs">{messages.columnIncompatibles}</Badge></td>
                  {canWrite && (
                    <td className="p-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit?.(e)} disabled={deleteMutation.isPending}>{messages.edit}</Button>{' '}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(e)} disabled={deleteMutation.isPending}><Trash2 size={14} className="mr-1" />{messages.btnSupprimer}</Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </TableBody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={(query.page ?? 1) === 1 || isPending} onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) - 1 }))}>Précédent</Button>
            <span className="text-xs text-muted-foreground">{query.page} / {totalPages}</span>
            <Button size="sm" disabled={(query.page ?? 1) >= totalPages || isPending} onClick={() => setQuery((q) => ({ ...q, page: (q.page ?? 1) + 1 }))}>Suivant</Button>
          </div>
        </div>
      )}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.deleteExigenceSalle}</DialogTitle>
            <DialogDescription>{messages.deleteExigenceSalleConfirm.replace('{name}', deleteLabel)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDelete(false)} disabled={deleteMutation.isPending}>{messages.cancel}</Button>
            <Button type="button" onClick={handleConfirmDelete} disabled={deleteMutation.isPending} variant="destructive">{deleteMutation.isPending ? messages.loading : messages.btnSupprimer}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
