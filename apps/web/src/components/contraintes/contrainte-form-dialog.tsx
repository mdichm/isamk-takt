'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateContrainteInstance,
  useUpdateContrainteInstance,
  useContrainteApresValidation,
} from '@/hooks/use-contraintes';
import {
  findAllContrainteDefinitions,
  type ContrainteDefinition,
  type AppliquerContrainteApresValidationInput,
} from '@/lib/api/contraintes';
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
import type { CreateContrainteInstanceInput, UpdateContrainteInstanceInput } from '@/lib/api/contraintes';

const formSchema = z.object({
  definitionId: z.string().min(1, { message: messages.formContrainteDefinitionRequired }),
  semestreId: z.string().min(1, { message: messages.formContrainteSemestreRequired }),
  enseignantId: z.string().optional().or(z.literal('')),
  groupeId: z.string().optional().or(z.literal('')),
  salleId: z.string().optional().or(z.literal('')),
  moduleId: z.string().optional().or(z.literal('')),
  poids: z.number().min(0).max(100).optional().nullable(),
  nature: z.enum(['REGLE', 'VOEU']),
  commentaire: z.string().optional().or(z.literal('')),
  actif: z.boolean().optional().default(true),
  application: z.enum(['immediate', 'next_generation']).optional(),
  profilId: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface ContrainteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceToEdit?: { id: string; definitionId: string; semestreId: string };
  hasPublishedVersion?: boolean;
  profils?: Array<{ id: string; code: string; libelle: string }>;
}

export function ContrainteFormDialog({
  open, onOpenChange, instanceToEdit, hasPublishedVersion, profils,
}: ContrainteFormDialogProps) {
  const isEdit = !!instanceToEdit;
  const [definitions, setDefinitions] = useState<ContrainteDefinition[]>([]);
  const [selectedDefinition, setSelectedDefinition] = useState<ContrainteDefinition | null>(null);
  const [applicationMode, setApplicationMode] = useState<'immediate' | 'next_generation' | null>(null);

  const createMutation = useCreateContrainteInstance();
  const updateMutation = useUpdateContrainteInstance();
  const apresValidationMutation = useContrainteApresValidation();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      definitionId: instanceToEdit?.definitionId ?? '',
      semestreId: instanceToEdit?.semestreId ?? '',
      enseignantId: '',
      groupeId: '',
      salleId: '',
      moduleId: '',
      poids: null,
      nature: 'REGLE',
      commentaire: '',
      actif: true,
      application: hasPublishedVersion ? 'immediate' : undefined,
      profilId: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    findAllContrainteDefinitions({ actif: true, limit: 100 }).then((r) => {
      if (!cancelled) setDefinitions(r.data);
    });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (form.watch('definitionId')) {
      const def = definitions.find((d) => d.id === form.watch('definitionId'));
      setSelectedDefinition(def ?? null);
    }
  }, [form.watch('definitionId'), definitions]);

  useEffect(() => {
    if (hasPublishedVersion && applicationMode === null) {
      setApplicationMode('immediate');
    }
  }, [hasPublishedVersion]);

  const poidsDisabled = selectedDefinition?.categorie === 'DURE';
  const showApplicationChoice = isEdit && hasPublishedVersion;

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const input: CreateContrainteInstanceInput | UpdateContrainteInstanceInput = {
      semestreId: data.semestreId,
      definitionId: data.definitionId,
      enseignantId: data.enseignantId || undefined,
      groupeId: data.groupeId || undefined,
      salleId: data.salleId || undefined,
      moduleId: data.moduleId || undefined,
      poids: poidsDisabled ? undefined : (data.poids ?? undefined),
      nature: data.nature,
      commentaire: data.commentaire || undefined,
      actif: data.actif,
    };

    if (isEdit && instanceToEdit) {
      if (showApplicationChoice) {
        const apresInput: AppliquerContrainteApresValidationInput = {
          application: data.application ?? 'immediate',
          definitionId: data.definitionId,
          enseignantId: data.enseignantId || undefined,
          groupeId: data.groupeId || undefined,
          salleId: data.salleId || undefined,
          moduleId: data.moduleId || undefined,
          poids: poidsDisabled ? undefined : (data.poids ?? undefined),
          nature: data.nature,
          commentaire: data.commentaire || undefined,
          actif: data.actif,
        };
        if (data.application === 'next_generation') {
          apresInput.profilId = data.profilId || undefined;
        }
        apresValidationMutation.mutate({ id: instanceToEdit.id, input: apresInput });
      } else {
        updateMutation.mutate({ id: instanceToEdit.id, input });
      }
    } else {
      createMutation.mutate(input as CreateContrainteInstanceInput);
    }
  };
  const cibleOptions = [
    { label: messages.cibleAucune, value: '', id: '' },
    { label: messages.cibleEnseignant, value: 'enseignantId', id: 'enseignantId' },
    { label: messages.cibleGroupe, value: 'groupeId', id: 'groupeId' },
    { label: messages.cibleSalle, value: 'salleId', id: 'salleId' },
    { label: messages.cibleModule, value: 'moduleId', id: 'moduleId' },
  ];

  const cibleForPortee: Record<string, string> = {
    GLOBALE: '',
    ENSEIGNANT: 'enseignantId',
    GROUPE: 'groupeId',
    SALLE: 'salleId',
    MODULE: 'moduleId',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? messages.editContrainteInstance : messages.createContrainteInstance}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? messages.editContrainteInstanceDesc : messages.createContrainteInstanceDesc}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.labelDefinition}</Label>
            <Select {...form.register('definitionId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectDefinition} /></SelectTrigger>
              <SelectContent>
                {definitions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.code} — {d.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.definitionId && (
              <span className="text-sm text-destructive">{form.formState.errors.definitionId.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.labelSemestre}</Label>
            <Input {...form.register('semestreId')} placeholder="ID du semestre…" />
            {form.formState.errors.semestreId && (
              <span className="text-sm text-destructive">{form.formState.errors.semestreId.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>{messages.labelCible}</Label>
            <Select
              value={cibleForPortee[selectedDefinition?.portee ?? 'GLOBALE']}
              onValueChange={(v) => {
                form.setValue('enseignantId', '');
                form.setValue('groupeId', '');
                form.setValue('salleId', '');
                form.setValue('moduleId', '');
                if (v) form.setValue(v as 'enseignantId' | 'groupeId' | 'salleId' | 'moduleId', v);
              }}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectCible} /></SelectTrigger>
              <SelectContent>
                {cibleOptions.map((o) => (
                  <SelectItem key={o.id} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {selectedDefinition
                ? messages.ciblePourPortee.replace('{portee}', selectedDefinition.portee)
                : messages.cibleSelectionnezDefinition
            }
            </p>
          </div>

          <div className="space-y-2">
            <Label>{messages.labelPoids}</Label>
            <Input
              type="number"
              {...form.register('poids')}
              placeholder="0-100"
              disabled={poidsDisabled}
              className={poidsDisabled ? 'bg-zinc-100 dark:bg-zinc-900/50' : ''}
            />
            {poidsDisabled && (
              <p className="text-[11px] text-muted-foreground">
                {messages.poidsInterditDure}
              </p>
            )}
            {!poidsDisabled && form.formState.errors.poids && (
              <span className="text-sm text-destructive">{form.formState.errors.poids.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>{messages.labelNature}</Label>
            <Select {...form.register('nature')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectNature} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="REGLE">{messages.natureRegle}</SelectItem>
                <SelectItem value="VOEU">{messages.natureVoeu}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{messages.labelCommentaire}</Label>
            <Input {...form.register('commentaire')} placeholder="Commentaire…" />
          </div>

          <div className="space-y-2">
            <Label>{messages.labelEstActive}</Label>
            <Select {...form.register('actif')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectEtat} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{messages.active}</SelectItem>
                <SelectItem value="false">{messages.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedDefinition && (
            <div className="flex items-start gap-2 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <div className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                {messages.poidsPourSouple.replace('{categorie}', selectedDefinition.categorie === 'SOUPLE' ? messages.categorieSouple : messages.categorieDure)}
              </div>
            </div>
          )}

          {showApplicationChoice && (
            <div className="space-y-4 p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <Label className="font-medium">{messages.contrainteApresValidation}</Label>
                  <p className="text-sm text-muted-foreground">
                    {messages.infoVersionPubliee}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{messages.labelModeApplication}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="radio"
                      name="application"
                      value="immediate"
                      checked={form.getValues('application') === 'immediate'}
                      onChange={(e) => {
                        form.setValue('application', e.target.value as 'immediate' | 'next_generation');
                        setApplicationMode('immediate');
                      }}
                    />
                    {messages.modeImmediate}
                  </label>
                  <label className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="radio"
                      name="application"
                      value="next_generation"
                      checked={form.getValues('application') === 'next_generation'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        form.setValue('application', e.target.value as 'immediate' | 'next_generation');
                        setApplicationMode('next_generation');
                      }}
                    />
                    {messages.modeNextGeneration}
                  </label>
                </div>

                {form.getValues('application') === 'next_generation' && (
                  <div className="space-y-2">
                    <Label>{messages.labelProfil}</Label>
                    <p className="text-xs text-muted-foreground">{messages.labelProfilHint}</p>
                    <Select {...form.register('profilId')}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectProfil} /></SelectTrigger>
                      <SelectContent>
                        {profils?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {apresValidationMutation.isSuccess && (
            <div className="space-y-2 p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm">{messages.successContrainteApresValidation}</p>
                  {apresValidationMutation.data?.versionPublieeId && (
                    <p className="text-xs text-muted-foreground">
                      {messages.versionPubliee}: {apresValidationMutation.data.versionPublieeId}
                    </p>
                  )}
                  {apresValidationMutation.data?.versionId && (
                    <p className="text-xs text-muted-foreground">
                      {messages.versionTravail}: {apresValidationMutation.data.versionId}
                    </p>
                  )}
                  {apresValidationMutation.data?.actionRequiree === 'regenerer' && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">{messages.actionRegenerer}</p>
                  )}
                  {apresValidationMutation.data?.actionRequiree === 'aucun' && (
                    <p className="text-sm text-green-600 dark:text-green-400">{messages.actionAucune}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending || updateMutation.isPending || apresValidationMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || apresValidationMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending || apresValidationMutation.isPending ? messages.loading : (isEdit ? messages.save : messages.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}