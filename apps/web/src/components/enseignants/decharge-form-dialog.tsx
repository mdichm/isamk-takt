'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateDecharge, useUpdateDecharge,
} from '@/hooks/use-decharges';
import {
  findAllSemestres,
  type Semestre,
} from '@/lib/api/annees';
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
import type { Decharge } from '@/lib/api/decharges';

const formSchema = z.object({
  heures: z.coerce.number().min(0, { message: messages.heuresMin }).max(1000, { message: messages.heuresMax }),
  semestreId: z.string().min(1, { message: messages.semestreRequired }),
});

type FormData = z.infer<typeof formSchema>;

interface DechargeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  enseignantId: string;
  anneeId: string;
  dechargeToEdit?: Decharge;
}

export function DechargeFormDialog({
  open, onOpenChange, onSuccess, enseignantId, anneeId, dechargeToEdit,
}: DechargeFormDialogProps) {
  const isEdit = !!dechargeToEdit;
  const [semestres, setSemestres] = useState<Semestre[]>([]);

  const createMutation = useCreateDecharge();
  const updateMutation = useUpdateDecharge();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      heures: dechargeToEdit?.heures ?? 0,
      semestreId: dechargeToEdit?.semestreId ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    findAllSemestres(anneeId).then((r) => {
      if (!cancelled) setSemestres(r.data);
    });
    return () => { cancelled = true; };
  }, [open, anneeId]);

  const isLoadingRefs = open && semestres.length === 0;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const input = {
      heures: data.heures,
      enseignantId,
      semestreId: data.semestreId,
    };

    try {
      if (isEdit && dechargeToEdit) {
        await updateMutation.mutateAsync({
          id: dechargeToEdit.id,
          input,
        });
      } else {
        await createMutation.mutateAsync(input);
      }
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch {
      // L'erreur est déjà affichée par le hook (toast)
    }
  };

  if (isLoadingRefs) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? messages.editDecharge : messages.createDecharge}
          </DialogTitle>
          <DialogDescription>{messages.dechargeDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.labelHeures}</Label>
            <Input type="number" step="0.5" {...form.register('heures')} />
            {form.formState.errors.heures && (
              <span className="text-sm text-destructive">{form.formState.errors.heures.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.columnSemestreDecharge}</Label>
            <Select {...form.register('semestreId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.selectSemestre} /></SelectTrigger>
              <SelectContent>
                {semestres.map((s) => (
                  <SelectItem key={s.id} value={s.id}>Semestre {s.numero}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.semestreId && (
              <span className="text-sm text-destructive">{form.formState.errors.semestreId.message}</span>
            )}
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
