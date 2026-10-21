'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateAffectation, useUpdateAffectation,
} from '@/hooks/use-affectations';

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
  Affectation, CreateAffectationInput, UpdateAffectationInput,
} from '@/lib/api/repartitions';

const formSchema = z.object({
  enseignantId: z.string().min(1, { message: 'L’enseignant est requis.' }),
  groupeId: z.string().optional().or(z.literal('')),
  moduleId: z.string().min(1, { message: 'Le module est requis.' }),
  typeEnseignementId: z.string().min(1, { message: 'Le type d’enseignement est requis.' }),
  activityTagId: z.string().optional().or(z.literal('')),
  seancesParSemaine: z.number()
    .int({ message: 'Le nombre de séances par semaine est requis.' })
    .min(1, { message: 'Le nombre de séances doit être supérieur à 0.' }),
  dureeMinutes: z.number()
    .int({ message: 'La durée est requise.' })
    .min(30, { message: 'La durée doit être supérieure à 0.' })
    .refine((v) => v % 30 === 0, { message: 'La durée doit être un multiple de 30 minutes.' }),
  estCmCommun: z.boolean().optional().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface AffectationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repartitionId: string;
  affectationToEdit?: Affectation;
  onSuccess?: () => void;
}

export function AffectationFormDialog({
  open, onOpenChange, repartitionId, affectationToEdit, onSuccess,
}: AffectationFormDialogProps) {
  const isEdit = !!affectationToEdit;
  const [enseignants, setEnseignants] = useState<{ id: string; matricule: string; nom: string; prenom: string }[]>([]);
  const [groupes, setGroupes] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [typesEnseignement, setTypesEnseignement] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [activityTags, setActivityTags] = useState<{ id: string; code: string; libelle: string }[]>([]);

  const createMutation = useCreateAffectation();
  const updateMutation = useUpdateAffectation();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      enseignantId: affectationToEdit?.enseignantId ?? '',
      groupeId: affectationToEdit?.groupeId ?? '',
      moduleId: affectationToEdit?.moduleId ?? '',
      typeEnseignementId: affectationToEdit?.typeEnseignementId ?? '',
      activityTagId: affectationToEdit?.activityTagId ?? '',
      seancesParSemaine: affectationToEdit?.seancesParSemaine ?? 1,
      dureeMinutes: affectationToEdit?.dureeMinutes ?? 90,
      estCmCommun: affectationToEdit?.estCmCommun ?? false,
    },
  });

  const volumeHebdo = (form.getValues('seancesParSemaine') as number) *
    (form.getValues('dureeMinutes') as number);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      fetch('/api/enseignants?limit=100').then((r) => r.json()).then((r: { data: { id: string; matricule: string; nom: string; prenom: string }[] }) => { if (!cancelled) setEnseignants(r.data); }),
      fetch('/api/groupes?limit=100').then((r) => r.json()).then((r: { data: { id: string; code: string; libelle: string }[] }) => { if (!cancelled) setGroupes(r.data); }),
      fetch('/api/modules').then((r) => r.json()).then((m: { id: string; code: string; libelle: string }[]) => { if (!cancelled) setModules(m); }),
      fetch('/api/modules/types-enseignement').then((r) => r.json()).then((t: { id: string; code: string; libelle: string }[]) => { if (!cancelled) setTypesEnseignement(t); }),
      fetch('/api/activity-tags?limit=100').then((r) => r.json()).then((r: { data: { id: string; code: string; libelle: string }[] }) => { if (!cancelled) setActivityTags(r.data); }),
    ]);
    return () => { cancelled = true; };
  }, [open]);

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const input: CreateAffectationInput | UpdateAffectationInput = {
      enseignantId: data.enseignantId,
      groupeId: data.groupeId || undefined,
      moduleId: data.moduleId,
      typeEnseignementId: data.typeEnseignementId,
      activityTagId: data.activityTagId || undefined,
      seancesParSemaine: data.seancesParSemaine,
      dureeMinutes: data.dureeMinutes,
      estCmCommun: data.estCmCommun,
    };

    if (isEdit && affectationToEdit) {
      void updateMutation.mutate({
        repartitionId,
        id: affectationToEdit.id,
        input,
      });
    } else {
      void createMutation.mutate({ repartitionId, input: input as CreateAffectationInput });
    }
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Modifier l’affectation' : 'Créer une affectation'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Modifier l’affectation'
                : 'Ajoutez une affectation d’enseignement pour cette répartition.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Enseignant</Label>
              <Select {...form.register('enseignantId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un enseignant" /></SelectTrigger>
                <SelectContent>
                  {enseignants.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.matricule} — {e.prenom} {e.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.enseignantId && (
                <span className="text-sm text-destructive">{form.formState.errors.enseignantId.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select {...form.register('groupeId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{'Aucun'}</SelectItem>
                  {groupes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.code} — {g.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select {...form.register('moduleId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un module" /></SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.code} — {m.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.moduleId && (
                <span className="text-sm text-destructive">{form.formState.errors.moduleId.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type d’enseignement</Label>
              <Select {...form.register('typeEnseignementId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                <SelectContent>
                  {typesEnseignement.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.code} — {t.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.typeEnseignementId && (
                <span className="text-sm text-destructive">{form.formState.errors.typeEnseignementId.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tag activité</Label>
              <Select {...form.register('activityTagId')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{'Aucun'}</SelectItem>
                  {activityTags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.code} — {t.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Séances par semaine</Label>
              <Input type="number" {...form.register('seancesParSemaine')} placeholder="1" />
              {form.formState.errors.seancesParSemaine && (
                <span className="text-sm text-destructive">{form.formState.errors.seancesParSemaine.message}</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input type="number" {...form.register('dureeMinutes')} placeholder="90" />
              <span className="text-xs text-muted-foreground">La durée doit être un multiple de 30 minutes.</span>
              {form.formState.errors.dureeMinutes && (
                <span className="text-sm text-destructive">{form.formState.errors.dureeMinutes.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>CM commun</Label>
              <Select {...form.register('estCmCommun')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un état" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Actif</SelectItem>
                  <SelectItem value="false">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Volume hebdo</Label>
            <div className="text-sm font-mono text-muted-foreground">
              {volumeHebdo} min
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}