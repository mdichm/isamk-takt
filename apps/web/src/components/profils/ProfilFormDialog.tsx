'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { messages } from '@/lib/messages/fr';
import { useCreateProfil, useUpdateProfil } from '@/hooks/use-profils';
import type { CreateProfilInput, UpdateProfilInput, Profil } from '@/lib/api/profils';
import { PoidsScoreEditor } from './PoidsScoreEditor';

interface ProfilFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semestreId: string;
  profil?: Profil;
  onSuccess: () => void;
}

export function ProfilFormDialog({
  open,
  onOpenChange,
  semestreId,
  profil,
  onSuccess,
}: ProfilFormDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [nom, setNom] = useState(profil?.nom ?? '');
  const [dureeLimiteMinutes, setDureeLimiteMinutes] = useState(
    profil?.dureeLimiteMinutes ?? 120,
  );
  const [preserverVerrous, setPreserverVerrous] = useState(
    profil?.preserverVerrous ?? false,
  );
  const [engineVersion, setEngineVersion] = useState(profil?.engineVersion ?? '');
  const [constructeurVersion, setConstructeurVersion] = useState(
    profil?.constructeurVersion ?? '',
  );
  const [graines, setGraines] = useState(
    profil?.graines?.join(', ') ?? '',
  );
  const [poidsScore, setPoidsScore] = useState<Record<string, number>>(
    (profil?.poidsScore as Record<string, number>) ?? {
      remplissage: 40,
      compactage: 30,
      creneaux: 20,
      caved: 10,
    },
  );

  const isEdit = !!profil;
  const createMut = useCreateProfil(semestreId);
  const updateMut = useUpdateProfil(semestreId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const grainesArray = graines
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n));
      if (isEdit && profil) {
        const input: UpdateProfilInput = {
          nom,
          dureeLimiteMinutes,
          preserverVerrous,
          engineVersion: engineVersion || undefined,
          constructeurVersion: constructeurVersion || undefined,
          graines: grainesArray,
          poidsScore,
        };
        await updateMut.mutateAsync({ id: profil.id, input });
      } else {
        const input: CreateProfilInput = {
          semestreId,
          nom,
          dureeLimiteMinutes,
          preserverVerrous,
          engineVersion: engineVersion || undefined,
          constructeurVersion: constructeurVersion || undefined,
          graines: grainesArray,
          poidsScore,
        };
        await createMut.mutateAsync(input);
      }
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
          <DialogTitle>
            {isEdit ? messages.edit : messages.creerProfil}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? messages.profilUtilise
              : 'Créez un nouveau profil de génération pour ce semestre.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="profil-nom">{messages.nomProfil}</Label>
            <Input
              id="profil-nom"
              placeholder={messages.nomProfilPlaceholder}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-duree">{messages.dureeLimite}</Label>
            <Input
              id="profil-duree"
              type="number"
              min="1"
              placeholder={messages.dureeLimitePlaceholder}
              value={dureeLimiteMinutes}
              onChange={(e) =>
                setDureeLimiteMinutes(parseInt(e.target.value) || 120)
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="profil-preserver-verrous"
                checked={preserverVerrous}
                onCheckedChange={setPreserverVerrous}
                disabled={isPending}
              />
              <Label htmlFor="profil-preserver-verrous">
                {messages.preserverVerrous}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-engine">{messages.engineVersion}</Label>
            <Input
              id="profil-engine"
              placeholder={messages.engineVersionPlaceholder}
              value={engineVersion}
              onChange={(e) => setEngineVersion(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-constructeur">{messages.constructeurVersion}</Label>
            <Input
              id="profil-constructeur"
              placeholder={messages.constructeurVersionPlaceholder}
              value={constructeurVersion}
              onChange={(e) => setConstructeurVersion(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profil-graines">{messages.graines}</Label>
            <Input
              id="profil-graines"
              placeholder={messages.grainesPlaceholder}
              value={graines}
              onChange={(e) => setGraines(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Saisissez des nombres séparés par des virgules.
            </p>
          </div>

          <PoidsScoreEditor
            valeur={poidsScore}
            onChange={setPoidsScore}
            disabled={isPending}
          />

          <DialogFooter>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Chargement...'
                : isEdit
                ? messages.save
                : messages.creerProfil}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
