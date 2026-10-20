'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useModuleVolumes, useDeleteModuleVolume,
} from '@/hooks/use-volumes';
import { messages } from '@/lib/messages/fr';
import { ModuleVolume } from '@/lib/api/volumes';
import { VolumeFormDialog } from './volume-form-dialog';

const typeLabels: Record<string, string> = {
  CM: messages.typeCM,
  TD: messages.typeTD,
  TP: messages.typeTP,
  CI: messages.typeCI,
  AUTRE: messages.typeAutre,
};

interface VolumesTableProps {
  moduleId: string;
}

export function VolumesTable({ moduleId }: VolumesTableProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState('');

  const { data, error } = useModuleVolumes(moduleId, {
    page: 1, limit: 100,
  });
  const deleteMutation = useDeleteModuleVolume();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadVolumes,
      variant: 'destructive',
    });
  }

  const volumes = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleDelete = (v: ModuleVolume) => {
    setDeleteId(v.id);
    setDeleteType(v.type);
    setOpenDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ moduleId, volumeId: deleteId });
    setOpenDelete(false);
    setDeleteId(null);
    setDeleteType('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.volumes}</h1>
          <p className="text-muted-foreground">{messages.volumesSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)} disabled={deleteMutation.isPending}>
            <span className="flex items-center gap-2">
              <span className="mr-2">+</span>
              {messages.createVolume}
            </span>
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-1/3">{messages.volumeColumnType}</TableHeader>
              <TableHeader className="text-right w-1/3">{messages.volumeColumnVolume}</TableHeader>
              <TableHeader className="text-right">{messages.volumeColumnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volumes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  {messages.noVolumes}
                </TableCell>
              </TableRow>
            ) : (
              volumes.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <Badge variant="default">{typeLabels[v.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {v.volume} min
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(v)}
                      disabled={deleteMutation.isPending}
                    >
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
            {messages.noVolumes}
          </div>
        )}
      </div>

      <Button onClick={() => setOpenCreate(true)} disabled={deleteMutation.isPending}>
        {messages.createVolume}
      </Button>

      <VolumeFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        moduleId={moduleId}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.deleteVolume}</DialogTitle>
            <DialogDescription>
              {messages.deleteVolumeConfirm.replace('{type}', deleteType)}
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
              {deleteMutation.isPending ? messages.loading : messages.deleteVolume}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
