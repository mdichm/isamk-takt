'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { messages } from '@/lib/messages/fr';
import { useCreateProfil } from '@/hooks/use-profils';
import type { Profil } from '@/lib/api/profils';
import type { CreateProfilInput } from '@/lib/api/profils';

interface NouvelleVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semestreId: string;
  profilSource: Profil;
  onSuccess: () => void;
}

export function NouvelleVersionDialog({
  open,
  onOpenChange,
  semestreId,
  profilSource,
  onSuccess,
}: NouvelleVersionDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [nom, setNom] = useState(`${profilSource.nom} v${profilSource.numero + 1}`);

  const createMut = useCreateProfil(semestreId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const grainesArray = (profilSource.graines as number[]) ?? [];

      const input: CreateProfilInput = {
        semestreId,
        nom,
        dureeLimiteMinutes: profilSource.dureeLimiteMinutes,
        preserverVerrous: profilSource.preserverVerrous,
        engineVersion: profilSource.engineVersion,
        constructeurVersion: profilSource.constructeurVersion,
        graines: grainesArray,
        poidsScore: profilSource.poidsScore as Record<string, number>,
      };
      await createMut.mutateAsync(input);
      onSuccess();
      onOpenChange(false);
    } catch {
      // Errors handled by mutation onError toast
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{messages.nouvelleVersion}</DialogTitle>
          <DialogDescription>
            Créez une nouvelle version du profil en copiant les valeurs du profil source.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nouvelle-version-nom">{messages.nomProfil}</Label>
            <Input
              id="nouvelle-version-nom"
              placeholder={messages.nomProfilPlaceholder}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg mb-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">
              Profil source
            </p>
            <p className="font-medium">{profilSource.nom}</p>
            <p className="text-xs text-muted-foreground">
              Version {profilSource.numero} • {profilSource.estParDefaut ? messages.estParDefaut : ''}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {messages.btnAnnuler}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Chargement...' : messages.btnNouvelleVersion}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}