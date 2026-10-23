'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VerrouBadge } from './VerrouBadge';
import { messages } from '@/lib/messages/fr';
import { previewLeveVerrou, leveVerrouById, type VerrouPreview } from '@/lib/api/verrous';
import { useToast } from '@/components/ui/use-toast';

interface VerrouLevePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verrouId: string;
  verrouType: 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE';
  onSuccess: () => void;
}

export function VerrouLevePreviewDialog({
  open,
  onOpenChange,
  verrouId,
  verrouType,
  onSuccess,
}: VerrouLevePreviewDialogProps) {
  const [preview, setPreview] = useState<VerrouPreview | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    previewLeveVerrou(verrouId)
      .then(setPreview)
      .catch(() => setPreviewError(messages.errorPreviewLeve));
  }, [open, verrouId]);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await leveVerrouById(verrouId);
      toast({ description: 'Verrou levé avec succès.' });
      onSuccess();
      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        description: messages.errorLeveVerrou,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.verrouConfirmerLevee}</DialogTitle>
          <DialogDescription>
            Vous allez lever ce verrou. Toutes les séances concernées seront de nouveau modifiables.
          </DialogDescription>
        </DialogHeader>

        {previewError ? (
          <div className="p-4 rounded-lg bg-destructive/50 border border-destructive/20 text-destructive">
            {previewError}
          </div>
        ) : preview && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <VerrouBadge type={verrouType} size="sm" />
              <span className="font-semibold">{messages.verrouApercuImpact}</span>
            </div>

            <div className="p-3 rounded-lg bg-muted border border-border/50">
              <span className="text-xs font-medium text-muted-foreground block mb-1">
                {messages.verrouSeancesConcernees}
              </span>
              <span className="font-mono">{preview.seancesConcernees}</span>
            </div>

            {preview.avertissement && (
              <div className="p-3 rounded-lg bg-amber/50 border border-amber/20 text-amber-900 text-sm">
                {preview.avertissement}
              </div>
            )}
          </section>
        )}

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} variant="outline">
            {messages.btnAnnuler}
          </Button>
          {!previewError && preview ? (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? 'Chargement...' : messages.btnConfirmer}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
