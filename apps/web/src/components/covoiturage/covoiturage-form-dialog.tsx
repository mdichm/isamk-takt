'use client';

import { useEffect, useState } from 'react';
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
import { findAllEnseignants, Enseignant } from '@/lib/api/enseignants';
import { messages } from '@/lib/messages/fr';

interface CovoiturageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semestreId: string;
  groupe?: {
    id: string;
    semestreId: string;
    enseignantIds: string[];
    margeMinutes: number;
    joursCommunsMin: number;
    strict: boolean;
  };
  onSave: (groupe: {
    semestreId: string;
    enseignantIds: string[];
    margeMinutes: number;
    joursCommunsMin: number;
    strict: boolean;
  }) => Promise<void>;
}

export function CovoiturageFormDialog({
  open,
  onOpenChange,
  semestreId,
  groupe,
  onSave,
}: CovoiturageFormDialogProps) {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    groupe?.enseignantIds ?? [],
  );
  const [margeMinutes, setMargeMinutes] = useState<number>(
    groupe?.margeMinutes ?? 60,
  );
  const [joursCommunsMin, setJoursCommunsMin] = useState<number>(
    groupe?.joursCommunsMin ?? 1,
  );
  const [strict, setStrict] = useState<boolean>(groupe?.strict ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    findAllEnseignants({ limit: 100 }).then((r) => {
      if (mounted) setEnseignants(r.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleEnseignant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError(undefined);
    if (selectedIds.length < 2) {
      setError(messages.errorMinTwoTeachers);
      return;
    }
    setLoading(true);
    try {
      await onSave({
        semestreId,
        enseignantIds: selectedIds,
        margeMinutes,
        joursCommunsMin,
        strict,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!groupe;

  return (
    <Dialog key={groupe?.id ?? 'new'} open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button variant="outline" size="sm" disabled={loading}>
          {isEdit ? messages.edit : messages.create} {messages.entityGroupeCovoiturage}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? messages.editGroupeCovoiturage
              : messages.createGroupeCovoiturage}
          </DialogTitle>
          <DialogDescription>{messages.covoiturageDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.enseignants}</Label>
            <p className="text-xs text-muted-foreground">
              {messages.covoiturageMinTwoTeachers}
            </p>
            <div className="max-h-48 overflow-y-auto border border-input rounded-md p-2 space-y-1 bg-background">
              {enseignants.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 cursor-pointer select-none hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleEnseignant(e.id)}
                    className="accent-primary h-4 w-4 shrink-0 rounded border-input"
                  />
                  <span className="text-sm">
                    {e.prenom} {e.nom} ({e.matricule})
                  </span>
                </label>
              ))}
              {enseignants.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {messages.errorNoTeachers}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.margeMinutes}</Label>
              <Input
                type="number"
                min="1"
                max="1440"
                value={margeMinutes}
                onChange={(evt) =>
                  setMargeMinutes(
                    Math.max(1, Math.min(1440, Number(evt.target.value || 1))),
                  )
                }
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label>{messages.joursCommunsMin}</Label>
              <Input
                type="number"
                min="1"
                max="7"
                value={joursCommunsMin}
                onChange={(evt) =>
                  setJoursCommunsMin(
                    Math.max(1, Math.min(7, Number(evt.target.value || 1))),
                  )
                }
                placeholder="1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={strict}
              onChange={(evt) => setStrict(evt.target.checked)}
              className="accent-primary h-4 w-4 shrink-0 rounded border-input"
            />
            <Label className="text-sm cursor-pointer">
              {strict ? messages.modeStrict : messages.modeSouple}
            </Label>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={loading || selectedIds.length < 2}>
              {isEdit ? messages.save : messages.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
