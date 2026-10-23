// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Page Vœux enseignants (L3-34)

'use client';

import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useVoeux, useCreateVoeu, useUpdateVoeu, useDeleteVoeu,
} from '@/hooks/use-voeux';
import {
  findAllEnseignants, type Enseignant,
} from '@/lib/api/enseignants';
import { SemestreSelector } from '@/components/creneaux/SemestreSelector';
import { messages } from '@/lib/messages/fr';
import { getErrorMessage } from '@/lib/api/errors';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  VOEU_CODES, VOEU_POIDS_VALUES, type VoeuResponseDto, type CreateVoeuDto, type VOEU_CODE,
} from '@/lib/api/voeux';
import { useAnnees } from '@/hooks/use-structure';

const queryClient = new QueryClient();

const CODE_LABELS: Record<string, string> = {
  TEACHER_AVOID_SLOT: 'Éviter un créneau',
  TEACHER_DAY_OFF_WISH: 'Jours de congé souhaités',
  TEACHER_DAYS_PER_WEEK: 'Jours par semaine',
  TEACHER_HOURS_PER_DAY: 'Heures par jour',
  TEACHER_GAPS: 'Trous entre séances',
};

const PARAM_SCHEMAS: Record<string, { label: string; type: 'number' | 'select'; options?: string[]; placeholder?: string }[]> = {
  TEACHER_AVOID_SLOT: [
    { label: 'Jour', type: 'select', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], placeholder: 'Jour' },
    { label: 'Créneau', type: 'select', options: ['Matin', 'Midi', 'Après-midi', 'Soir'], placeholder: 'Créneau' },
  ],
  TEACHER_DAY_OFF_WISH: [
    { label: 'Jour', type: 'select', options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], placeholder: 'Jour' },
  ],
  TEACHER_DAYS_PER_WEEK: [
    { label: 'Nombre de jours', type: 'number', placeholder: 'ex: 4' },
  ],
  TEACHER_HOURS_PER_DAY: [
    { label: 'Nombre d\'heures', type: 'number', placeholder: 'ex: 6' },
  ],
  TEACHER_GAPS: [
    { label: 'Trous max', type: 'number', placeholder: 'ex: 2' },
  ],
};

function canManageVoeu(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'GESTIONNAIRE',
    'DIRECTION',
  ].includes(role ?? '');
}

export default function VoeuxPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>('');
  const [selectedEnseignantId, setSelectedEnseignantId] = useState<string>('');
  const [editingVoeu, setEditingVoeu] = useState<VoeuResponseDto | null>(null);
  const role = getCurrentUserRole();
  const canManage = canManageVoeu(role);
  const { toast } = useToast();

  const { data: annees, isPending: anneesPending } = useAnnees();

  const defaultAnneeId = annees?.data?.[0]?.id ?? '';

  if (role === undefined || anneesPending) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  const { data, isPending, error } = useVoeux({
    semestreId: selectedSemestreId || undefined,
    enseignantId: selectedEnseignantId || undefined,
    page: 1,
    limit: 50,
  });

  const createMutation = useCreateVoeu();
  const updateMutation = useUpdateVoeu();
  const deleteMutation = useDeleteVoeu();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadVoeux,
      variant: 'destructive',
    });
  }

  const voeux = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleDelete = (v: VoeuResponseDto) => {
    setEditingVoeu(null);
    if (window.confirm(`${messages.deleteVoeuInstanceConfirm.replace('{name}', v.code)}`)) {
      deleteMutation.mutate(v.id);
    }
  };

  const handleSave = (input: CreateVoeuDto | { id: string; input: Partial<CreateVoeuDto> }) => {
    if ('id' in input) {
      updateMutation.mutate({ id: input.id, input: input.input });
    } else {
      createMutation.mutate(input);
    }
    setCreateOpen(false);
    setEditOpen(false);
    setEditingVoeu(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.voeux}</h1>
            <p className="text-muted-foreground">{messages.voeuxSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <SemestreSelector
              anneeId={defaultAnneeId}
              value={selectedSemestreId}
              onChange={setSelectedSemestreId}
              disabled={!canManage}
            />
            {canManage && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={18} className="mr-2" />
                {messages.btnAjouterVoeu}
              </Button>
            )}
            {!canManage && (
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {messages.errorForbidden}
              </span>
            )}
          </div>
        </div>

        {selectedSemestreId && (
          <div className="bordered">
            <div className="border-b p-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">{messages.labelEnseignant}</Label>
                <Select
                  value={selectedEnseignantId}
                  onValueChange={(v) => setSelectedEnseignantId(v ?? '')}
                  disabled={!canManage}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={messages.formSelectEnseignant} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les enseignants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeader>{messages.columnEnseignant}</TableHeader>
                      <TableHeader>{messages.columnCode}</TableHeader>
                      <TableHeader>{messages.columnPoids}</TableHeader>
                      <TableHeader>{messages.columnSemestre}</TableHeader>
                      <TableHeader>{messages.columnAvertissement}</TableHeader>
                      <TableHeader className="text-right">{messages.btnSupprimer}</TableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voeux.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {total === 0 ? 'Aucun vœu trouvé.' : 'Aucun vœu trouvé.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      voeux.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.enseignantId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{CODE_LABELS[v.code] ?? v.code}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={v.poids ? 'default' : 'secondary'}>{v.poids}</Badge>
                          </TableCell>
                          <TableCell>{v.semestreId}</TableCell>
                          <TableCell>
                            {v.avertissement ? (
                              <Badge variant="destructive" size="sm" title={v.avertissement}>
                                ⚠
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canManage && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingVoeu(v);
                                    setEditOpen(true);
                                  }}
                                  disabled={updateMutation.isPending || deleteMutation.isPending}
                                >
                                  <Edit2 size={14} className="mr-1" />
                                  {messages.edit}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(v)}
                                  disabled={updateMutation.isPending || deleteMutation.isPending}
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  {messages.delete}
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {total > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total : {total} vœu{total > 1 ? 'x' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messages.btnAjouterVoeu}</DialogTitle>
            </DialogHeader>
            <VoeuxForm
              onSave={handleSave}
              isEdit={false}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messages.edit}</DialogTitle>
            </DialogHeader>
            <VoeuxForm
              onSave={handleSave}
              isEdit={true}
              initialVoeu={editingVoeu}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </QueryClientProvider>
  );
}

function VoeuxForm({
  open,
  onOpenChange,
  isEdit,
  initialVoeu,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  initialVoeu?: VoeuResponseDto | null;
  onSave: (input: CreateVoeuDto | { id: string; input: Partial<CreateVoeuDto> }) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<{
    semestreId: string;
    enseignantId: string;
    code: VOEU_CODE;
    poids: number;
    commentaire: string;
    actif: boolean;
    params: Record<string, string | number>;
  }>({
    semestreId: '',
    enseignantId: '',
    code: 'TEACHER_DAY_OFF_WISH',
    poids: 25,
    commentaire: '',
    actif: true,
    params: {},
  });
  const [paramsErrors, setParamsErrors] = useState<Record<string, string>>({});

  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);

  useEffect(() => {
    if (!open) return;
    findAllEnseignants({ limit: 100 }).then((r) => {
      setEnseignants(r.data);
    });
  }, [open]);

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!open || !isEdit || !initialVoeu || isInitializedRef.current) return;
    isInitializedRef.current = true;
    setFormData({
      semestreId: initialVoeu.semestreId,
      enseignantId: initialVoeu.enseignantId,
      code: initialVoeu.code,
      poids: initialVoeu.poids ?? 25,
      commentaire: initialVoeu.commentaire ?? '',
      actif: initialVoeu.actif,
      params: initialVoeu.params as unknown as Record<string, string | number>,
    });
  }, [open, isEdit, initialVoeu]);

  const fields = PARAM_SCHEMAS[formData.code] ?? [];

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, params: { ...prev.params, [key]: value } }));
  };

  const validateParams = (): boolean => {
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = formData.params[field.label];
      if (field.type === 'number') {
        const n = Number(value);
        if (!value || isNaN(n) || n <= 0) {
          errors[field.label] = 'Valeur requise';
        }
      } else if (field.type === 'select') {
        if (!value) {
          errors[field.label] = 'Sélection requise';
        }
      }
    });
    setParamsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateParams()) return;

    const params: Record<string, unknown> = {};
    fields.forEach((field) => {
      params[field.label] = formData.params[field.label];
    });
    params.code = formData.code;

    const input: CreateVoeuDto = {
      semestreId: formData.semestreId,
      enseignantId: formData.enseignantId,
      code: formData.code,
      poids: formData.poids,
      params,
      commentaire: formData.commentaire || undefined,
      actif: formData.actif,
    };

    if (isEdit && initialVoeu) {
      onSave({ id: initialVoeu.id, input: { params, poids: formData.poids, commentaire: formData.commentaire || undefined, actif: formData.actif } });
    } else {
      onSave(input);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{messages.labelSemestre}</Label>
        <Input
          disabled
          value={formData.semestreId}
          placeholder="Semestre"
        />
      </div>

      <div className="space-y-2">
        <Label>{messages.labelEnseignant}</Label>
        <Select
          value={formData.enseignantId}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, enseignantId: v ?? '' }))}
          disabled={isEdit}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={messages.formSelectEnseignant} />
          </SelectTrigger>
          <SelectContent>
            {enseignants.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.prenom} {e.nom} ({e.matricule})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{messages.labelCodeVoeu}</Label>
        <Select
          value={formData.code}
          onValueChange={(v) => {
            const newCode = v ?? '';
            setFormData((prev) => ({ ...prev, code: newCode, params: {} }));
            setParamsErrors({});
          }}
          disabled={isEdit}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={messages.formSelectCodeVoeu} />
          </SelectTrigger>
          <SelectContent>
            {VOEU_CODES.map((c) => (
              <SelectItem key={c} value={c}>
                {CODE_LABELS[c] ?? c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{messages.labelPoidsVoeu}</Label>
        <Select
          value={String(formData.poids)}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, poids: Number(v) }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Poids" />
          </SelectTrigger>
          <SelectContent>
            {VOEU_POIDS_VALUES.map((p) => (
              <SelectItem key={String(p)} value={String(p)}>
                {String(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{messages.poidsValide}</p>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          <Label>Paramètres</Label>
          <div className="space-y-2">
            {fields.map((field) => {
              const value = formData.params[field.label] ?? '';
              const error = paramsErrors[field.label];
              return (
                <div key={field.label} className="space-y-1">
                  <Label className="text-sm">{field.label}</Label>
                  {field.type === 'number' ? (
                    <Input
                      type="number"
                      value={String(value)}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      placeholder={field.placeholder}
                      error={!!error}
                      className={error ? 'border-destructive' : ''}
                    />
                  ) : (
                    <Select
                      value={String(value)}
                      onValueChange={(v) => handleChange(field.label, v ?? '')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {error && <span className="text-sm text-destructive">{error}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>{messages.labelCommentaireVoeu}</Label>
        <Textarea
          value={formData.commentaire}
          onChange={(e) => setFormData((prev) => ({ ...prev, commentaire: e.target.value }))}
          placeholder="Commentaire…"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>{messages.labelEstActiveVoeu}</Label>
        <Select
          value={String(formData.actif)}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, actif: v === 'true' }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{messages.active}</SelectItem>
            <SelectItem value="false">{messages.inactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
          {messages.cancel}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? messages.loading : (isEdit ? messages.save : messages.create)}
        </Button>
      </DialogFooter>
    </form>
  );
}