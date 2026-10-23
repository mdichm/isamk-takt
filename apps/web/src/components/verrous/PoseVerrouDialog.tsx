'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VerrouBadge } from './VerrouBadge';
import { messages } from '@/lib/messages/fr';
import { poseVerrou, type PoseVerrouInput, type VerrouType } from '@/lib/api/verrous';
import { useToast } from '@/components/ui/use-toast';

interface PoseVerrouDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  seanceId: string;
  onSuccess: () => void;
}

export function PoseVerrouDialog({
  open,
  onOpenChange,
  versionId,
  seanceId,
  onSuccess,
}: PoseVerrouDialogProps) {
  const [type, setType] = useState<VerrouType>('CRENEAU');
  const [justification, setJustification] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const TYPES: { value: VerrouType; label: string }[] = [
    { value: 'CRENEAU', label: messages.verrouCreneau },
    { value: 'SALLE', label: messages.verrouSalle },
    { value: 'ENSEIGNANT', label: messages.verrouEnseignant },
    { value: 'ACTIVITE', label: messages.verrouActivite },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const input: PoseVerrouInput = {
        type,
        justification: justification || undefined,
      };
      await poseVerrou(versionId, seanceId, input);
      toast({ description: 'Verrou posé avec succès.' });
      onSuccess();
      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        description: messages.errorPoseVerrou,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.verrouPose}</DialogTitle>
          <DialogDescription>
            Choisissez le type de verrou à poser sur cette séance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verrou-type">Type de verrou</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as VerrouType)}
              id="verrou-type"
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <VerrouBadge type={t.value} size="sm" /> {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verrou-justification">
              {messages.verrouJustification}
            </Label>
            <Input
              id="verrou-justification"
              placeholder={messages.verrouJustificationPlaceholder}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              maxLength={1000}
            />
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)} variant="outline">
              {messages.btnAnnuler}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Chargement...' : messages.verrouPoser}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
