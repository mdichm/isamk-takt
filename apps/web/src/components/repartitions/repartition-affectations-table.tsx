'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages/fr';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useAffectations, useCreateAffectation, useUpdateAffectation, useDeleteAffectation,
} from '@/hooks/use-affectations';
import type { Affectation } from '@/lib/api/repartitions';
import { AffectationFormDialog } from './affectation-form-dialog';
import { AffectationDeleteDialog } from './affectation-delete-dialog';

interface RepartitionAffectationsTableProps {
  repartitionId: string;
}

export function RepartitionAffectationsTable({ repartitionId }: RepartitionAffectationsTableProps) {
  const [query, setQuery] = useState<{ page: number; limit: number }>({
    page: 1, limit: 20,
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editAffectation, setEditAffectation] = useState<Affectation | null>(null);
  const [deleteAffectation, setDeleteAffectation] = useState<Affectation | null>(null);

  const { data, isPending, error } = useAffectations(repartitionId, query);
  const createMutation = useCreateAffectation();
  const updateMutation = useUpdateAffectation();
  const deleteMutation = useDeleteAffectation();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadAffectations,
      variant: 'destructive',
    });
  }

  const affectations = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleCreate = () => {
    setEditAffectation(null);
    setOpenCreate(true);
  };

  const handleEdit = (a: Affectation) => {
    setEditAffectation(a);
    setOpenEdit(true);
  };

  const handleDelete = (a: Affectation) => {
    setDeleteAffectation(a);
    setOpenDelete(true);
  };

  const handleSuccess = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditAffectation(null);
    setDeleteAffectation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.affectations}</h1>
          <p className="text-muted-foreground">{messages.affectationsSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            <span className="flex items-center gap-2">
              <Plus size={18} className="mr-2" />
              {messages.createAffectation}
            </span>
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-1/4">{messages.columnGroupe}</TableHeader>
              <TableHeader className="w-1/4">{messages.columnModule}</TableHeader>
              <TableHeader>{messages.columnTypeEnseignement}</TableHeader>
              <TableHeader>{messages.columnEnseignant}</TableHeader>
              <TableHeader className="text-right">{messages.columnActivityTag}</TableHeader>
              <TableHeader className="text-right">{messages.columnVolumeHebdo}</TableHeader>
              <TableHeader className="text-right">{messages.columnSeances}</TableHeader>
              <TableHeader className="text-right">{messages.columnDuree}</TableHeader>
              <TableHeader className="text-right">{messages.columnEcart}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affectations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  {messages.noAffectations}
                </TableCell>
              </TableRow>
            ) : (
              affectations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.groupeId ?? '—'}</TableCell>
                  <TableCell>{a.moduleId}</TableCell>
                  <TableCell>{a.typeEnseignementId}</TableCell>
                  <TableCell>{a.enseignantId}</TableCell>
                  <TableCell className="text-right">{a.activityTagId ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">{a.volumeHebdoMinutes} min</TableCell>
                  <TableCell className="text-right">{a.seancesParSemaine}</TableCell>
                  <TableCell className="text-right">{a.dureeMinutes} min</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(a)} disabled={updateMutation.isPending || deleteMutation.isPending}>
                      <Edit2 size={14} className="mr-1" />
                      {messages.btnEditer}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(a)} disabled={updateMutation.isPending || deleteMutation.isPending} className="text-destructive">
                      <Trash2 size={14} className="mr-1" />
                      {messages.btnSupprimer}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {messages.noAffectations}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={(query.page ?? 1) === 1 || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >Précédent</Button>
            <span className="text-xs text-muted-foreground">
              {query.page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={(query.page ?? 1) >= totalPages || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >Suivant</Button>
          </div>
        </div>
      )}

      <AffectationFormDialog
        open={openCreate || openEdit}
        onOpenChange={(open) => {
          if (!open) { setOpenCreate(false); setOpenEdit(false); setEditAffectation(null); }
        }}
        repartitionId={repartitionId}
        affectationToEdit={openEdit ? (editAffectation ?? undefined) : undefined}
        onSuccess={handleSuccess}
      />

      <AffectationDeleteDialog
        open={openDelete}
        onOpenChange={(open) => { if (!open) setDeleteAffectation(null); }}
        affectation={deleteAffectation}
        onSuccess={handleSuccess}
      />
    </div>
  );
}