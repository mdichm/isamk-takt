'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDemande } from '@/hooks/use-demandes';
import { findAllDepartements } from '@/lib/api/structure';
import type { Departement } from '@/lib/api/structure';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { messages } from '@/lib/messages/fr';

const formSchema = z.object({
  semestreId: z.string().min(1, { message: 'Le semestre est requis.' }),
  departementCode: z.string().min(1, { message: 'Le département est requis.' }),
  type: z.enum(['ANOMALIE', 'MODIFICATION']),
  cible: z.string().min(1, { message: 'La cible est requise.' }),
  motif: z.string().min(1, { message: 'Le motif est requis.' }).max(2000, {
    message: 'Le motif ne peut pas dépasser 2000 caractères.',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface DemandeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemandeFormDialog({
  open,
  onOpenChange,
}: DemandeFormDialogProps) {
  const [departements, setDepartements] = useState<Departement[]>([]);
  const createMutation = useCreateDemande();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      semestreId: '',
      departementCode: '',
      type: 'ANOMALIE',
      cible: '',
      motif: '',
    },
  });

  useEffect(() => {
    if (open) {
      findAllDepartements({ limit: 100 }).then((page) => {
        setDepartements(page.data);
      });
    }
  }, [open]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    let cible: unknown;
    try {
      cible = JSON.parse(data.cible);
    } catch {
      cible = data.cible;
    }
    createMutation.mutate({
      semestreId: data.semestreId,
      departementCode: data.departementCode,
      type: data.type,
      cible,
      motif: data.motif,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.createDemande}</DialogTitle>
          <DialogDescription>{messages.createDemandeDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelSemestre}</Label>
              <Select {...form.register('semestreId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectSemestre} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">{messages.semestreS1}</SelectItem>
                  <SelectItem value="S2">{messages.semestreS2}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.semestreId && (
                <span className="text-sm text-destructive">{form.formState.errors.semestreId.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.departement}</Label>
              <Select {...form.register('departementCode')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectDepartement} /></SelectTrigger>
                <SelectContent>
                  {departements.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.code} — {d.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departementCode && (
                <span className="text-sm text-destructive">{form.formState.errors.departementCode.message}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{messages.labelType}</Label>
            <Select {...form.register('type')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectType} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ANOMALIE">{messages.typeAnomalie}</SelectItem>
                <SelectItem value="MODIFICATION">{messages.typeModification}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <span className="text-sm text-destructive">{form.formState.errors.type.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.labelCible}</Label>
            <Input {...form.register('cible')} placeholder='{"affectationKey": "..."}' />
            <span className="text-xs text-muted-foreground">{messages.cibleHint}</span>
            {form.formState.errors.cible && (
              <span className="text-sm text-destructive">{form.formState.errors.cible.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.labelMotif}</Label>
            <Textarea {...form.register('motif')} rows={4} placeholder={messages.motifPlaceholder} />
            {form.formState.errors.motif && (
              <span className="text-sm text-destructive">{form.formState.errors.motif.message}</span>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? messages.saving : messages.btnCreer}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}