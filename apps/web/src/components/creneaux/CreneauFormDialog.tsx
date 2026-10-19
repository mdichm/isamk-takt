'use client';


import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateCreneau, useUpdateCreneau,
} from '@/hooks/use-creneaux';
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
  Creneau, CreateCreneauInput, UpdateCreneauInput,
} from '@/lib/api/creneaux';
import { useSemestres } from '@/hooks/use-structure';

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
  jour: z.string().min(1, { message: messages.formJourRequired }),
  ordre: z.number().min(1, { message: messages.formOrdreRequired }),
  heureDebut: z.string().min(1, { message: messages.formHeureDebutRequired }),
  heureFin: z.string().min(1, { message: messages.formHeureFinRequired }),
  estPause: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface CreneauFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creneauToEdit?: Creneau;
}

export function CreneauFormDialog({
  open, onOpenChange, creneauToEdit,
}: CreneauFormDialogProps) {
  const isEdit = !!creneauToEdit;
  const { data: semestres } = useSemestres({
    anneeId: undefined,
  });

  const createMutation = useCreateCreneau();
  const updateMutation = useUpdateCreneau();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      semestreId: creneauToEdit?.semestreId ?? '',
      jour: creneauToEdit?.jour ?? 'LUNDI',
      ordre: creneauToEdit?.ordre ?? 1,
      heureDebut: creneauToEdit?.heureDebut ?? '08:00:00',
      heureFin: creneauToEdit?.heureFin ?? '08:30:00',
      estPause: creneauToEdit?.estPause ?? false,
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isEdit && creneauToEdit) {
      const input: UpdateCreneauInput = {
        ordre: data.ordre,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        estPause: data.estPause,
      };
      updateMutation.mutate({ id: creneauToEdit.id, input });
    } else {
      const input: CreateCreneauInput = {
        semestreId: data.semestreId,
        jour: data.jour,
        ordre: data.ordre,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        estPause: data.estPause,
      };
      createMutation.mutate(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? messages.editCreneau : messages.createCreneau}</DialogTitle>
          <DialogDescription>
            {isEdit ? messages.editCreneauDesc : messages.createCreneauDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.formSelectSemestre}</Label>
            <Select {...form.register('semestreId')}>
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
            <Select {...form.register('jour')}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnOrdre}</Label>
              <Input type="number" {...form.register('ordre')} placeholder="1" />
              {form.formState.errors.ordre && (
                <span className="text-sm text-destructive">{form.formState.errors.ordre.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.columnHeureDebut}</Label>
              <Input type="time" {...form.register('heureDebut')} />
              {form.formState.errors.heureDebut && (
                <span className="text-sm text-destructive">{form.formState.errors.heureDebut.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnHeureFin}</Label>
              <Input type="time" {...form.register('heureFin')} />
              {form.formState.errors.heureFin && (
                <span className="text-sm text-destructive">{form.formState.errors.heureFin.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.columnEstPause}</Label>
              <Select {...form.register('estPause')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{messages.pause}</SelectItem>
                  <SelectItem value="false">{messages.cours}</SelectItem>
                </SelectContent>
              </Select>
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