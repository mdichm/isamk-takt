'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages/fr';
import type { Profil } from '@/lib/api/profils';

interface ProfilDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profil: Profil;
}

export function ProfilDetailDialog({
  open,
  onOpenChange,
  profil,
}: ProfilDetailDialogProps) {
  const formattedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{profil.nom}</DialogTitle>
          <DialogDescription>
            Version {profil.numero} — {profil.estParDefaut ? messages.estParDefaut : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">
                {messages.dureeLimite}
              </p>
              <p className="font-medium">{profil.dureeLimiteMinutes} min</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">
                {messages.preserverVerrous}
              </p>
              <p className="font-medium">
                {profil.preserverVerrous ? 'Oui' : 'Non'}
              </p>
            </div>
          </div>

          {profil.engineVersion && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">
                {messages.engineVersion}
              </p>
              <p className="font-medium">{profil.engineVersion}</p>
            </div>
          )}

          {profil.constructeurVersion && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase">
                {messages.constructeurVersion}
              </p>
              <p className="font-medium">{profil.constructeurVersion}</p>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground uppercase mb-1">
              {messages.poidsScore}
            </p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[
                { label: messages.poidsRemplissage, key: 'remplissage' },
                { label: messages.poidsCompactage, key: 'compactage' },
                { label: messages.poidsCreneaux, key: 'creneaux' },
                { label: messages.poidsCaved, key: 'caved' },
              ].map((c) => {
                const v = (profil.poidsScore as Record<string, number>)?.[c.key];
                return (
                  <div key={c.key} className="text-center">
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                    <div className="font-mono font-medium">{v ?? 0}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">{messages.dateCreation}:</span>{' '}
              {formattedDate(profil.createdAt)}
            </div>
            <div>
              <span className="font-medium">{messages.dateModification}:</span>{' '}
              {formattedDate(profil.updatedAt)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {messages.btnFermer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}