'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdoptGeneration } from '@/hooks/use-generations';
import { messages } from '@/lib/messages/fr';
import { t } from '@/lib/i18n';
import { type GenerationSummary } from '@/lib/api/generations';

interface GenerationAdoptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generation: GenerationSummary;
}

export function GenerationAdoptDialog({
  open,
  onOpenChange,
  generation,
}: GenerationAdoptDialogProps) {
  const [motif, setMotif] = useState('');
  const adoptMutation = useAdoptGeneration(generation.versionId);

  const isAdoptable =
    generation.statut === 'SUCCEEDED' ||
    generation.statut === 'SUCCEEDED_WITH_WARNINGS';

  const handleSubmit = () => {
    adoptMutation.mutate({ generationId: generation.id });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('confirmerAdoption')}</DialogTitle>
          <DialogDescription>
            {t('adopterGeneration').replace('{nom}', generation.versionNom)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>{t('numeroVersion')} :</strong> {generation.versionNom}
            </p>
            <p>
              <strong>{t('etat')} :</strong> {generation.statut}
            </p>
            {generation.score != null && (
              <p>
                <strong>{t('scoreGlobal')} :</strong> {generation.score}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="motif-adoption">{t('motifAdoption')}</Label>
            <Textarea
              id="motif-adoption"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t('motifAdoption')}
              className="h-32"
            />
            <p className="text-xs text-muted-foreground">
              {t('motifAdoptionOptionnel')}
            </p>
          </div>
          {!isAdoptable && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                {t('adoptionNonEligible')}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={!isAdoptable || adoptMutation.isPending}
          >
            {t('annuler')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isAdoptable || adoptMutation.isPending}
          >
            {adoptMutation.isPending
              ? t('adoptionEnCours')
              : t('btnAdopter')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
