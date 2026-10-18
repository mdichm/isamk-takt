'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateEnseignant, useUpdateEnseignant,
} from '@/hooks/use-enseignants';
import { findAllAnnees, type Annee, type PaginatedAnnees } from '@/lib/api/annees';
import { findAllDepartements, type Departement, type PaginatedDepartements } from '@/lib/api/structure';
import { findAllGrades, type GradeRef } from '@/lib/api/enseignants';
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
  CreateEnseignantInput, UpdateEnseignantInput, Enseignant,
} from '@/lib/api/enseignants';

const formSchema = z.object({
  matricule: z.string().min(1, { message: messages.matriculeRequired }),
  nom: z.string().min(1, { message: messages.nomRequired }),
  prenom: z.string().min(1, { message: messages.prenomRequired }),
  email: z.string().email({ message: messages.emailInvalide }),
  telephone: z.string().optional().or(z.literal('')),
  anneeId: z.string().min(1, { message: messages.anneeRequired }),
  departementId: z.string().min(1, { message: messages.departementRequired }),
  gradeId: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface EnseignantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  enseignantToEdit?: Enseignant;
}

export function EnseignantFormDialog({
  open, onOpenChange, onSuccess, enseignantToEdit,
}: EnseignantFormDialogProps) {
  const isEdit = !!enseignantToEdit;
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [grades, setGrades] = useState<GradeRef[]>([]);

  const createMutation = useCreateEnseignant();
  const updateMutation = useUpdateEnseignant();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      matricule: enseignantToEdit?.matricule ?? '',
      nom: enseignantToEdit?.nom ?? '',
      prenom: enseignantToEdit?.prenom ?? '',
      email: enseignantToEdit?.email ?? '',
      telephone: enseignantToEdit?.telephone ?? '',
      anneeId: enseignantToEdit?.anneeId ?? '',
      departementId: enseignantToEdit?.departementId ?? '',
      gradeId: enseignantToEdit?.gradeId ?? '',
      isActive: enseignantToEdit?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      findAllAnnees({ limit: 100 }).then((r: PaginatedAnnees) => { if (!cancelled) setAnnees(r.data); }),
      findAllDepartements({ limit: 100 }).then((r: PaginatedDepartements) => { if (!cancelled) setDepartements(r.data); }),
      findAllGrades().then((r: GradeRef[]) => { if (!cancelled) setGrades(r); }),
    ]);
    return () => { cancelled = true; };
  }, [open]);

  const isLoadingRefs = open && annees.length === 0 && departements.length === 0 && grades.length === 0;
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const input: CreateEnseignantInput | UpdateEnseignantInput = {
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone || null,
      anneeId: data.anneeId,
      departementId: data.departementId,
      gradeId: data.gradeId || undefined,
      isActive: data.isActive,
    };

    try {
      if (isEdit && enseignantToEdit) {
        await updateMutation.mutateAsync({
          id: enseignantToEdit.id,
          input: input as UpdateEnseignantInput,
        });
      } else {
        await createMutation.mutateAsync(input as CreateEnseignantInput);
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
            {isEdit ? messages.editEnseignant : messages.createEnseignant}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? messages.editEnseignantDesc
              : messages.createEnseignantDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.matricule}</Label>
              <Input {...form.register('matricule')} placeholder={messages.matriculePlaceholder} />
              {form.formState.errors.matricule && (
                <span className="text-sm text-destructive">{form.formState.errors.matricule.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.nom}</Label>
              <Input {...form.register('nom')} placeholder={messages.formLastNamePlaceholder} />
              {form.formState.errors.nom && (
                <span className="text-sm text-destructive">{form.formState.errors.nom.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.prenom}</Label>
              <Input {...form.register('prenom')} placeholder={messages.formFirstNamePlaceholder} />
              {form.formState.errors.prenom && (
                <span className="text-sm text-destructive">{form.formState.errors.prenom.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.email}</Label>
              <Input type="email" {...form.register('email')} placeholder={messages.formEmailPlaceholder} />
              {form.formState.errors.email && (
                <span className="text-sm text-destructive">{form.formState.errors.email.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.columnTelephone}</Label>
              <Input {...form.register('telephone')} placeholder={messages.telephonePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label>{messages.labelAnnee}</Label>
              <Select {...form.register('anneeId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectAnnee} /></SelectTrigger>
                <SelectContent>
                  {annees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.anneeId && (
                <span className="text-sm text-destructive">{form.formState.errors.anneeId.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelDepartement}</Label>
              <Select {...form.register('departementId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectDepartement} /></SelectTrigger>
                <SelectContent>
                  {departements.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.code} — {d.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departementId && (
                <span className="text-sm text-destructive">{form.formState.errors.departementId.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.labelGrade}</Label>
              <Select {...form.register('gradeId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectGrade} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{messages.aucun}</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.code} — {g.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{messages.active}</Label>
            <Select {...form.register('isActive')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{messages.active}</SelectItem>
                <SelectItem value="false">{messages.inactive}</SelectItem>
              </SelectContent>
            </Select>
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

