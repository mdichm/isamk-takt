'use client';

import { useState } from 'react';
import { useAccepterAvertissement } from '@/hooks/use-conflits';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { messages } from '@/lib/messages/fr';

interface AccepterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  avertissement: {
    signature: string;
    regleCode: string;
    message: string;
    seanceIds: string[];
    details?: Record<string, unknown>;
  };
  onAccepted: () => void;
}

export function AccepterDialog({
  open,
  onOpenChange,
  versionId,
  avertissement,
  onAccepted,
}: AccepterDialogProps) {
  const [justification, setJustification] = useState('');
  const [isPending, setIsPending] = useState(false);
  const accept = useAccepterAvertissement(versionId);

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      await accept.mutateAsync({
        signature: avertissement.signature,
        justification: justification || undefined,
      });
      onAccepted();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            {messages.avertissementAccepterTitre}
          </DialogTitle>
          <DialogDescription>
            {messages.avertissementAccepterDescription}
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{messages.avertissementRegle}</Label>
            <p className="text-sm font-medium text-muted-foreground truncate">
              {avertissement.regleCode}
            </p>
          </div>

          <div className="space-y-1">
            <Label>{messages.avertissementMessage}</Label>
            <p className="text-sm text-muted-foreground break-words">
              {avertissement.message}
            </p>
          </div>

          <div className="space-y-1">
            <Label>{messages.avertissementSeances}</Label>
            <p className="text-sm text-muted-foreground break-all">
              {avertissement.seanceIds.join(', ')}
            </p>
          </div>

          {avertissement.details && (
            <div className="space-y-1">
              <Label>{messages.avertissementDetails}</Label>
              <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(avertissement.details, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-1">
            <Label>{messages.avertissementJustification}</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={messages.avertissementJustificationPlaceholder}
              className="h-24"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {messages.avertissementImpactAvertissement}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {messages.btnAnnuler}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || accept.isPending}
          >
            {isPending || accept.isPending
              ? messages.avertissementAccepteurEnCours
              : messages.avertissementAccepterBouton}
          </Button>
        </DialogFooter>
      </DialogContent>
      <DialogDescription id="accepter-dialog-desc">
        {messages.avertissementAccepterDescription}
      </DialogDescription>
    </Dialog>
  );
}
