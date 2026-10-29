'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransitionAnnee } from '@/hooks/use-annee-transition';
import { type Annee } from '@/lib/api/annees';
import { messages } from '@/lib/messages/fr';

interface AnneeClotureDialogProps {
  annee: Annee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloturee?: () => void;
}

/**
 * Boîte de dialogue de confirmation de clôture d'une année universitaire (L7-02).
 *
 * Le bouton "Clôturer l'année" est désactivé tant que le code saisi ne correspond
 * pas au code de l'année. L'appel à l'API est géré par useTransitionAnnee qui
 * affiche lui-même les toasts de succès / erreur.
 */
export function AnneeClotureDialog({
  annee,
  open,
  onOpenChange,
  onCloturee,
}: AnneeClotureDialogProps) {
  const [codeSaisi, setCodeSaisi] = useState('');

  const transition = useTransitionAnnee(annee.id);

  const estActive = annee.statut === 'ACTIVE';
  const codeCorrect = codeSaisi === annee.code;

  const handleConfirm = async () => {
    if (!codeCorrect) return;
    try {
      await transition.mutateAsync({ confirmation: codeSaisi });
      onCloturee?.();
      onOpenChange(false);
    } catch {
      // L'erreur est déjà affichée par le hook (toast). On garde le dialog ouvert.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button
          data-testid="cloture-declencheur"
          variant="destructive"
          disabled={!estActive}
          size="sm"
        >
          {messages.clotureBoutonConfirmer}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {messages.clotureTitre.replace('{code}', annee.code)}
          </DialogTitle>
          <DialogDescription>{messages.clotureDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="cloture-code">{messages.clotureLabelCode}</Label>
            <Input
              id="cloture-code"
              type="text"
              value={codeSaisi}
              onChange={(e) => setCodeSaisi(e.target.value)}
              placeholder={messages.cloturePlaceholderCode}
              disabled={transition.isPending}
              aria-invalid={!codeCorrect && codeSaisi.length > 0}
            />
            {!codeCorrect && codeSaisi.length > 0 && (
              <p className="text-xs text-destructive">
                {messages.clotureErreurConfirmation}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transition.isPending}>
            {messages.clotureBoutonAnnuler}
          </Button>
          <Button
            data-testid="cloture-confirmer"
            variant="destructive"
            disabled={!codeCorrect || transition.isPending}
            onClick={handleConfirm}
          >
            {transition.isPending ? 'Clôture en cours…' : messages.clotureBoutonConfirmer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
