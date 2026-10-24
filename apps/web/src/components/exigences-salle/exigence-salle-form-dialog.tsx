'use client';

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExigenceSalle, useUpdateExigenceSalle } from '@/hooks/use-exigences-salle';
import { findAllSalles, type Salle } from '@/lib/api/salles';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ExigenceSalleActivite, CreateExigenceSalleInput, UpdateExigenceSalleInput } from '@/lib/api/exigences-salle';

const formSchema = z
  .object({
    salleImposeeId: z.string().optional().or(z.literal('')),
    autorisees: z.array(z.string()).default([]),
  })
  .refine((data) => data.salleImposeeId || data.autorisees.length > 0, {
    message: messages.auMoinsUneSalleAutorisee,
    path: ['autorisees'],
  });

type FormData = z.infer<typeof formSchema>;

interface ExigenceSalleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semestreId: string;
  exigenceToEdit?: ExigenceSalleActivite;
  onSave: (exigence: ExigenceSalleActivite) => Promise<void>;
}

export function ExigenceSalleFormDialog({ open, onOpenChange, semestreId, exigenceToEdit, onSave }: ExigenceSalleFormDialogProps) {
  const isEdit = !!exigenceToEdit;
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loadingSalles, setLoadingSalles] = useState(false);

  const createMutation = useCreateExigenceSalle();
  const updateMutation = useUpdateExigenceSalle();

  const defaultSalleImposeeId = exigenceToEdit?.salleImposeeId ?? '';
  const defaultAutorisees = exigenceToEdit?.autorisees.map((a) => a.salleId) ?? [];

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: { salleImposeeId: defaultSalleImposeeId, autorisees: defaultAutorisees },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    findAllSalles({ limit: 100 })
      .then((r) => { if (!cancelled) { setSalles(r.data); setLoadingSalles(false); } })
      .catch(() => { if (!cancelled) setLoadingSalles(false); });
    return () => { cancelled = true; };
  }, [open]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const salleImposeeId = data.salleImposeeId || undefined;
    const autorisees = data.autorisees.length > 0 ? data.autorisees : undefined;
    const affectationKey = exigenceToEdit?.affectationKey ?? '';
    if (isEdit && exigenceToEdit) {
      const input: UpdateExigenceSalleInput = { salleImposeeId, autorisees };
      await updateMutation.mutateAsync({ id: exigenceToEdit.id, input });
    } else {
      const input: CreateExigenceSalleInput = {
        semestreId,
        affectationKey,
        salleImposeeId,
        autorisees,
      };
      await createMutation.mutateAsync(input);
    }
    onOpenChange(false);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? messages.editExigenceSalle : messages.createExigenceSalle}</DialogTitle>
          <DialogDescription>{messages.exigencesSalleDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.formAffectationKey}</Label>
            <Input defaultValue={exigenceToEdit?.affectationKey ?? ''} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{messages.formSalleImposee}</Label>
            <Select {...form.register('salleImposeeId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSalleImposeePlaceholder} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">{messages.aucun}</SelectItem>
                {salles.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} — {s.libelle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{messages.formSallesAutorisees}</Label>
            <Select {...form.register('autorisees')} multiple>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSallesAutoriseesPlaceholder} /></SelectTrigger>
              <SelectContent>
                {salles.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} — {s.libelle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isMutating}>{messages.cancel}</Button>
            <Button type="submit" disabled={isMutating || !form.formState.isValid}>{isMutating ? messages.loading : isEdit ? messages.save : messages.create}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
