'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateCreneauAffichage, useUpdateCreneauAffichage,
} from '@/hooks/use-ramadan';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type {
  CreneauAffichage, CreateCreneauAffichageInput, UpdateCreneauAffichageInput,
} from '@/lib/api/ramadan';
import { findAllCreneaux } from '@/lib/api/creneaux';
import { useSemestres } from '@/hooks/use-structure';

type Creneau = {
  id: string;
  semestreId: string;
  jour: string;
  ordre: number;
  heureDebut: string;
  heureFin: string;
  estPause: boolean;
  estActive: boolean;
};

const JOURS: { value: string; label: string }[] = [
  { value: 'LUNDI', label: messages.jourLundi },
  { value: 'MARDI', label: messages.jourMardi },
  { value: 'MERCREDI', label: messages.jourMercredi },
  { value: 'JEUDI', label: messages.jourJeudi },
  { value: 'VENDREDI', label: messages.jourVendredi },
  { value: 'SAMEDI', label: messages.jourSamedi },
];

const formSchema = z.object({
  semestreId: z.string().min(1, { message: messages.formSemestreRequired }),
  creneauId: z.string().min(1, { message: 'Le créneau est requis.' }),
  jour: z.string().min(1, { message: messages.formJourRequired }),
  ordre: z.number().min(1, { message: messages.formOrdreRequired }),
  heureDebut: z.string().min(1, { message: messages.formHeureDebutRequired }),
  heureFin: z.string().min(1, { message: messages.formHeureFinRequired }),
}).refine((data) => data.heureFin > data.heureDebut, {
  message: messages.erreurHeureFin,
  path: ['heureFin'],
});

type FormData = z.infer<typeof formSchema>;

interface RamadanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creneauAffichageToEdit?: CreneauAffichage;
}

export function RamadanFormDialog({
  open, onOpenChange, creneauAffichageToEdit,
}: RamadanFormDialogProps) {
  const isEdit = !!creneauAffichageToEdit;
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [selectedJour, setSelectedJour] = useState<string>('LUNDI');
  const [semestreId, setSemestreId] = useState<string>(
    creneauAffichageToEdit?.creneauId ?? '',
  );
  const { data: semestres } = useSemestres({ anneeId: undefined });

  const createMutation = useCreateCreneauAffichage();
  const updateMutation = useUpdateCreneauAffichage();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      semestreId: creneauAffichageToEdit?.creneauId ?? '',
      creneauId: creneauAffichageToEdit?.creneauId ?? '',
      jour: creneauAffichageToEdit?.creneauId ?? 'LUNDI',
      ordre: 1,
      heureDebut: creneauAffichageToEdit?.heureDebut ?? '07:30:00',
      heureFin: creneauAffichageToEdit?.heureFin ?? '09:00:00',
    },
  });

  useEffect(() => {
    let mounted = true;
    const loadCreneaux = async () => {
      if (!semestreId) return;
      const res = await findAllCreneaux({
        semestreId,
        limit: 100,
        estActive: true,
      });
      if (mounted) setCreneaux(res.data);
    };
    loadCreneaux();
    return () => { mounted = false; };
  }, [semestreId]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isEdit && creneauAffichageToEdit) {
      const input: UpdateCreneauAffichageInput = {
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
      };
      updateMutation.mutate({ id: creneauAffichageToEdit.id, input });
    } else {
      const input: CreateCreneauAffichageInput = {
        creneauId: data.creneauId,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
      };
      createMutation.mutate(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? messages.editRamadan : messages.createRamadan}</DialogTitle>
          <DialogDescription>{isEdit ? messages.editRamadanDesc : messages.createRamadanDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.formSelectSemestre}</Label>
            <Select
              {...form.register('semestreId')}
              onValueChange={(v) => setSemestreId(String(v ?? ''))}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectSemestre} /></SelectTrigger>
              <SelectContent>
                {semestres?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Semestre {s.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.semestreId && (
              <span className="text-sm text-destructive">{form.formState.errors.semestreId.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.columnJour}</Label>
            <Select
              {...form.register('jour')}
              onValueChange={(v) => setSelectedJour(String(v ?? ''))}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formJourPlaceholder} /></SelectTrigger>
              <SelectContent>
                {JOURS.map((j) => (
                  <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.jour && (
              <span className="text-sm text-destructive">{form.formState.errors.jour.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>Créneau</Label>
            <Select {...form.register('creneauId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un créneau" /></SelectTrigger>
              <SelectContent>
                {creneaux
                  .filter((c) => c.jour === selectedJour && !c.estPause)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Ordre {c.ordre} — {c.heureDebut} - {c.heureFin}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.formState.errors.creneauId && (
              <span className="text-sm text-destructive">{form.formState.errors.creneauId.message}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnHeureDebutRamadan}</Label>
              <Input type="time" {...form.register('heureDebut')} />
              {form.formState.errors.heureDebut && (
                <span className="text-sm text-destructive">{form.formState.errors.heureDebut.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.columnHeureFinRamadan}</Label>
              <Input type="time" {...form.register('heureFin')} />
              {form.formState.errors.heureFin && (
                <span className="text-sm text-destructive">{form.formState.errors.heureFin.message}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? messages.loading : (isEdit ? messages.save : messages.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
