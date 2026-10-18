'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  useDecharges, useDeleteDecharge,
} from '@/hooks/use-decharges';
import { messages } from '@/lib/messages/fr';
import {
  DechargeFormDialog,
} from '@/components/enseignants/decharge-form-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';

interface DechargesPanelProps {
  enseignantId: string;
  anneeId: string;
  onRefresh: () => void;
}

export function DechargesPanel({ enseignantId, anneeId, onRefresh }: DechargesPanelProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isPending, error } = useDecharges({ enseignantId });
  const deleteMutation = useDeleteDecharge();
  const { toast } = useToast();
  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadDecharges,
      variant: 'destructive',
    });
  }

  const decharges = data?.data ?? [];

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setOpenDelete(false);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{messages.decharges}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.dechargesSubtitle}
          </p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          {messages.create} {messages.entityDecharge}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background">
        {isPending && <div className="h-48 flex items-center justify-center">{messages.loading}</div>}
        {!isPending && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader>{messages.columnSemestreDecharge}</TableHeader>
                <TableHeader>{messages.columnHeures}</TableHeader>
                <TableHeader>{messages.columnActions}</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    {messages.noDecharges}
                  </TableCell>
                </TableRow>
              ) : (
                decharges.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.semestreId}</TableCell>
                    <TableCell>{d.heures} h</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleDelete(d.id)} disabled={deleteMutation.isPending}>
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

      <DechargeFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={() => {
          onRefresh();
        }}
        enseignantId={enseignantId}
        anneeId={anneeId}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.deleteDecharge}</DialogTitle>
            <DialogDescription>{messages.deleteDechargeConfirm}</DialogDescription>
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
