'use client';


import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateIndisponibilite, useUpdateIndisponibilite,
} from '@/hooks/use-indisponibilites';
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
  Indisponibilite, CreateIndisponibiliteInput, UpdateIndisponibiliteInput,
} from '@/lib/api/indisponibilites';
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
  enseignantId: z.string().optional().or(z.literal('')),
  salleId: z.string().optional().or(z.literal('')),
}).refine((data) => {
  const hasEnseignant = !!data.enseignantId;
  const hasSalle = !!data.salleId;
  return hasEnseignant !== hasSalle;
}, {
  message: messages.indisponibiliteXor,
  path: ['enseignantId'],
});

type FormData = z.infer<typeof formSchema>;

interface IndisponibiliteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indisponibiliteToEdit?: Indisponibilite;
}

export function IndisponibiliteFormDialog({
  open, onOpenChange, indisponibiliteToEdit,
}: IndisponibiliteFormDialogProps) {
  const isEdit = !!indisponibiliteToEdit;
  const { data: semestres } = useSemestres({
    anneeId: undefined,
  });

  const createMutation = useCreateIndisponibilite();
  const updateMutation = useUpdateIndisponibilite();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      semestreId: indisponibiliteToEdit?.semestreId ?? '',
      jour: indisponibiliteToEdit?.jour ?? 'LUNDI',
      ordre: indisponibiliteToEdit?.ordre ?? 1,
      enseignantId: indisponibiliteToEdit?.enseignantId ?? '',
      salleId: indisponibiliteToEdit?.salleId ?? '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isEdit && indisponibiliteToEdit) {
      const input: UpdateIndisponibiliteInput = {
        jour: data.jour,
        ordre: data.ordre,
        enseignantId: data.enseignantId || undefined,
        salleId: data.salleId || undefined,
      };
      updateMutation.mutate({ id: indisponibiliteToEdit.id, input });
    } else {
      const input: CreateIndisponibiliteInput = {
        semestreId: data.semestreId,
        jour: data.jour,
        ordre: data.ordre,
        enseignantId: data.enseignantId || undefined,
        salleId: data.salleId || undefined,
      };
      createMutation.mutate(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? messages.editIndisponibilite : messages.createIndisponibilite}</DialogTitle>
          <DialogDescription>
            {isEdit ? messages.editIndisponibiliteDesc : messages.createIndisponibiliteDesc}
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
          <div className="space-y-2">
            <Label>{messages.columnOrdre}</Label>
            <Input type="number" {...form.register('ordre')} placeholder="1" />
            {form.formState.errors.ordre && (
              <span className="text-sm text-destructive">{form.formState.errors.ordre.message}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnEnseignant}</Label>
              <Input {...form.register('enseignantId')} placeholder="ID enseignant (optionnel)" />
            </div>
            <div className="space-y-2">
              <Label>{messages.columnSalle}</Label>
              <Input {...form.register('salleId')} placeholder="ID salle (optionnel)" />
            </div>
          </div>
          {form.formState.errors.enseignantId && (
            <span className="text-sm text-destructive">{form.formState.errors.enseignantId.message}</span>
          )}
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