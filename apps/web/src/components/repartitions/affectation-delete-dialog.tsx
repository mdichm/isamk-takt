'use client';

import { useDeleteAffectation } from '@/hooks/use-affectations';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { Affectation } from '@/lib/api/repartitions';

interface AffectationDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectation: Affectation | null;
  onSuccess?: () => void;
}

export function AffectationDeleteDialog({
  open, onOpenChange, affectation, onSuccess,
}: AffectationDeleteDialogProps) {
  const deleteMutation = useDeleteAffectation();

  const handleConfirmDelete = () => {
    if (!affectation) return;
    void deleteMutation.mutate({
      repartitionId: affectation.repartitionId,
      id: affectation.id,
    });
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.deleteAffectation}</DialogTitle>
          <DialogDescription>
            {messages.deleteAffectationConfirm}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            {messages.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            variant="destructive"
          >
            {deleteMutation.isPending ? messages.loading : messages.deleteAffectation}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
