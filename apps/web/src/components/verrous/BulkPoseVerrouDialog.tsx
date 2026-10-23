'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VerrouBadge } from './VerrouBadge';
import { messages } from '@/lib/messages/fr';
import { bulkPoseVerrou, type BulkPoseVerrouInput } from '@/lib/api/verrous';
import { useToast } from '@/components/ui/use-toast';

type CibleType = 'GROUPE' | 'ENSEIGNANT' | 'SALLE';

interface BulkPoseVerrouDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
  cibleType: CibleType;
  cibleId: string;
  cibleLibelle: string;
  onSuccess: (result: { poses: number; ignores: number }) => void;
}

export function BulkPoseVerrouDialog({
  open,
  onOpenChange,
  versionId,
  cibleType,
  cibleId,
  cibleLibelle,
  onSuccess,
}: BulkPoseVerrouDialogProps) {
  const [type, setType] = useState<'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE'>('CRENEAU');
  const [justification, setJustification] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const TYPES: { value: 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE'; label: string }[] = [
    { value: 'CRENEAU', label: messages.verrouCreneau },
    { value: 'SALLE', label: messages.verrouSalle },
    { value: 'ENSEIGNANT', label: messages.verrouEnseignant },
    { value: 'ACTIVITE', label: messages.verrouActivite },
  ];

  const CIBLE_LABELS: Record<CibleType, string> = {
    GROUPE: 'Groupe',
    ENSEIGNANT: 'Enseignant',
    SALLE: 'Salle',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const input: BulkPoseVerrouInput = {
        cible: { type: cibleType, id: cibleId },
        type,
        justification: justification || undefined,
      };
      const result = await bulkPoseVerrou(versionId, input);
      toast({
        description: `${result.poses} verrou${result.poses > 1 ? 'x' : ''} posé${result.poses > 1 ? 'x' : ''}, ${result.ignores} ignoré${result.ignores > 1 ? 's' : ''} (déjà verrouillé).`,
      });
      onSuccess(result);
      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        description: messages.errorBulkPoseVerrou,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.verrouBulkPose}</DialogTitle>
          <DialogDescription>
            Posez un verrou en masse sur toutes les séances de {CIBLE_LABELS[cibleType]} «{cibleLibelle}».
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-cible">Cible</Label>
            <div className="flex items-center gap-2 text-sm">
              <VerrouBadge type={type as 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE'} size="sm" />
              <span className="font-medium">{cibleLibelle}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-type">Type de verrou</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'CRENEAU' | 'SALLE' | 'ENSEIGNANT' | 'ACTIVITE')}
              id="bulk-type"
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
            <Label htmlFor="bulk-justification">
              {messages.verrouJustification}
            </Label>
            <Input
              id="bulk-justification"
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
              {isPending ? 'Chargement...' : messages.verrouPoserEnMasse}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
