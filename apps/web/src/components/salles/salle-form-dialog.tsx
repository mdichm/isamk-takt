'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateSalle, useUpdateSalle,
} from '@/hooks/use-salles';
import { findAllSites, type SiteRef } from '@/lib/api/salles';
import { findAllTypeSalles, type TypeSalleRef } from '@/lib/api/salles';
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
  Salle, CreateSalleInput, UpdateSalleInput,
} from '@/lib/api/salles';

const formSchema = z.object({
  code: z.string().min(1, { message: messages.formCodeRequired }),
  libelle: z.string().min(1, { message: messages.formLibelleRequired }),
  siteId: z.string().optional().or(z.literal('')),
  capaciteMax: z.number().min(1, { message: messages.formCapaciteMin }),
  capaciteRecommandee: z.number().optional().or(z.literal('')),
  accesPMR: z.boolean().optional().default(false),
  commentaire: z.string().optional().or(z.literal('')),
  estActive: z.boolean().optional().default(true),
  departementId: z.string().optional().or(z.literal('')),
  typeSalleId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface SalleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salleToEdit?: Salle;
}

export function SalleFormDialog({
  open, onOpenChange, salleToEdit,
}: SalleFormDialogProps) {
  const isEdit = !!salleToEdit;
  const [sites, setSites] = useState<SiteRef[]>([]);
  const [typeSalles, setTypeSalles] = useState<TypeSalleRef[]>([]);

  const createMutation = useCreateSalle();
  const updateMutation = useUpdateSalle();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: salleToEdit?.code ?? '',
      libelle: salleToEdit?.libelle ?? '',
      siteId: salleToEdit?.siteId ?? '',
      capaciteMax: salleToEdit?.capaciteMax ?? 1,
      capaciteRecommandee: salleToEdit?.capaciteRecommandee ?? '',
      accesPMR: salleToEdit?.accesPMR ?? false,
      commentaire: salleToEdit?.commentaire ?? '',
      estActive: salleToEdit?.estActive ?? true,
      departementId: salleToEdit?.departementId ?? '',
      typeSalleId: salleToEdit?.typeSalleId ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      findAllSites({ limit: 100 }).then((r) => { if (!cancelled) setSites(r.data); }),
      findAllTypeSalles({ limit: 100 }).then((r) => { if (!cancelled) setTypeSalles(r.data); }),
    ]);
    return () => { cancelled = true; };
  }, [open]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isEdit && salleToEdit) {
      const input: UpdateSalleInput = {
        code: data.code,
        libelle: data.libelle,
        siteId: data.siteId || undefined,
        capaciteMax: data.capaciteMax,
        capaciteRecommandee: data.capaciteRecommandee || undefined,
        accesPMR: data.accesPMR,
        commentaire: data.commentaire || undefined,
        estActive: data.estActive,
        departementId: data.departementId || undefined,
        typeSalleId: data.typeSalleId || undefined,
      };
      updateMutation.mutate({ id: salleToEdit.id, input });
    } else {
      const input: CreateSalleInput = {
        code: data.code,
        libelle: data.libelle,
        siteId: data.siteId || undefined,
        capaciteMax: data.capaciteMax,
        capaciteRecommandee: data.capaciteRecommandee || undefined,
        accesPMR: data.accesPMR,
        commentaire: data.commentaire || undefined,
        estActive: data.estActive,
        departementId: data.departementId || undefined,
        typeSalleId: data.typeSalleId || undefined,
      };
      createMutation.mutate(input);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? messages.editSalle : messages.createSalle}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? messages.editSalleDesc : messages.createSalleDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnCode}</Label>
              <Input {...form.register('code')} placeholder={messages.formCodePlaceholder} />
              {form.formState.errors.code && (
                <span className="text-sm text-destructive">{form.formState.errors.code.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.columnLibelle}</Label>
              <Input {...form.register('libelle')} placeholder={messages.formLibellePlaceholder} />
              {form.formState.errors.libelle && (
                <span className="text-sm text-destructive">{form.formState.errors.libelle.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.formSelectSite}</Label>
              <Select {...form.register('siteId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectSite} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{messages.aucun}</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.code} — {s.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{messages.columnTypeSalle}</Label>
              <Select {...form.register('typeSalleId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectTypeSalle} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{messages.aucun}</SelectItem>
                  {typeSalles.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.code} — {t.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelCapaciteMax}</Label>
              <Input type="number" {...form.register('capaciteMax')} placeholder="0" />
              {form.formState.errors.capaciteMax && (
                <span className="text-sm text-destructive">{form.formState.errors.capaciteMax.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.labelCapaciteRecommandee}</Label>
              <Input type="number" {...form.register('capaciteRecommandee')} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{messages.labelAccesPMR}</Label>
            <Select {...form.register('accesPMR')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{messages.active}</SelectItem>
                <SelectItem value="false">{messages.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{messages.labelCommentaire}</Label>
            <Input {...form.register('commentaire')} placeholder="Commentaire…" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelDepartementSalle}</Label>
              <Input {...form.register('departementId')} placeholder="ID département (optionnel)" />
            </div>
            <div className="space-y-2">
              <Label>{messages.labelEstActive}</Label>
              <Select {...form.register('estActive')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{messages.active}</SelectItem>
                  <SelectItem value="false">{messages.inactive}</SelectItem>
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
