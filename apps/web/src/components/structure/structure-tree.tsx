'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Folder, School, GraduationCap, Users, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useDepartements, useCreateDepartement, useUpdateDepartement, useDeleteDepartement,
  useFormations, useCreateFormation, useUpdateFormation, useDeleteFormation,
  useNiveaux, useCreateNiveau, useUpdateNiveau, useDeleteNiveau,
  useGroupes, useCreateGroupe, useUpdateGroupe, useDeleteGroupe,
  useAnnees, useSemestres,
} from '@/hooks/use-structure';
import { Departement, Formation, Niveau, Groupe } from '@/lib/api/structure';
import { messages } from '@/lib/messages/fr';
import {
  departementSchema, formationSchema, niveauSchema, groupeSchema,
  DepartementFormValues, FormationFormValues, NiveauFormValues, GroupeFormValues,
} from '@/lib/validation/structure';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type EntityKind = 'departement' | 'formation' | 'niveau' | 'groupe';

interface TreeState {
  selectedDepartementId: string | null;
  selectedFormationId: string | null;
  selectedNiveauId: string | null;
  selectedGroupeId: string | null;
}

export function StructureTree() {
  const [mode, setMode] = useState<EntityKind>('departement');
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAnneeId, setSelectedAnneeId] = useState<string | null>(null);
  const [selectedSemestreId, setSelectedSemestreId] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeState>({
    selectedDepartementId: null,
    selectedFormationId: null,
    selectedNiveauId: null,
    selectedGroupeId: null,
  });

  /* ---------- Années & Semestres ---------- */
  const { data: anneesData, isLoading: anneesLoading } = useAnnees({ limit: 100 });
  const annees = anneesData ?? [];
  const semestres = useSemestres({ anneeId: selectedAnneeId ?? undefined });
  const semestreList = semestres.data ?? [];
  const semestresLoading = semestres.isLoading;

  /* ---------- Départements ---------- */
  const { data: departementsData, isLoading: depsLoading } = useDepartements({
    limit: 100,
    anneeId: selectedAnneeId ?? undefined,
  });
  const createDep = useCreateDepartement();
  const updateDep = useUpdateDepartement();
  const deleteDep = useDeleteDepartement();

  /* ---------- Formations ---------- */
  const { data: formationsData, isLoading: formLoading } = useFormations({
    limit: 100,
    departementId: tree.selectedDepartementId ?? undefined,
  });
  const createForm = useCreateFormation();
  const updateForm = useUpdateFormation();
  const deleteForm = useDeleteFormation();

  /* ---------- Niveaux ---------- */
  const { data: niveauxData, isLoading: nivLoading } = useNiveaux({
    limit: 100,
    formationId: tree.selectedFormationId ?? undefined,
  });
  const createNiv = useCreateNiveau();
  const updateNiv = useUpdateNiveau();
  const deleteNiv = useDeleteNiveau();

  /* ---------- Groupes ---------- */
  const { data: groupesData, isLoading: grpLoading } = useGroupes({
    limit: 100,
    niveauId: tree.selectedNiveauId ?? undefined,
    semestreId: selectedSemestreId ?? undefined,
  });
  const createGrp = useCreateGroupe();
  const updateGrp = useUpdateGroupe();
  const deleteGrp = useDeleteGroupe();

  if (anneesLoading || depsLoading || formLoading || nivLoading || grpLoading || semestresLoading) {
    return <div className="p-4">{messages.loading}</div>;
  }

  const departements: Departement[] = departementsData?.data ?? [];
  const formations: Formation[] = formationsData?.data ?? [];
  const niveaux: Niveau[] = niveauxData?.data ?? [];
  const groupes: Groupe[] = groupesData?.data ?? [];

  /* ---------- Formulaires réactifs ---------- */
  const depForm = useForm<DepartementFormValues>({
    resolver: zodResolver(departementSchema),
    defaultValues: { code: '', libelle: '', originId: '' },
  });
  const formForm = useForm<FormationFormValues>({
    resolver: zodResolver(formationSchema),
    defaultValues: { code: '', libelle: '', originId: '' },
  });
  const nivForm = useForm<NiveauFormValues>({
    resolver: zodResolver(niveauSchema),
    defaultValues: { code: '', libelle: '', originId: '' },
  });
  const grpForm = useForm<GroupeFormValues>({
    resolver: zodResolver(groupeSchema),
    defaultValues: { code: '', libelle: '', type: 'SECTION', parentId: '', effectif: undefined },
  });

  const handleSave = () => {
    switch (mode) {
      case 'departement': {
        if (!selectedAnneeId) return;
        const values = depForm.getValues();
        if (editingId) {
          updateDep.mutate({
            id: editingId,
            input: { code: values.code, libelle: values.libelle, originId: values.originId || undefined },
          });
        } else {
          createDep.mutate({
            anneeId: selectedAnneeId,
            code: values.code,
            libelle: values.libelle,
            originId: values.originId || undefined,
          });
        }
        break;
      }
      case 'formation': {
        if (!tree.selectedDepartementId) return;
        const values = formForm.getValues();
        if (editingId) {
          updateForm.mutate({
            id: editingId,
            input: { code: values.code, libelle: values.libelle, originId: values.originId || undefined },
          });
        } else {
          createForm.mutate({
            departementId: tree.selectedDepartementId,
            code: values.code,
            libelle: values.libelle,
            originId: values.originId || undefined,
          });
        }
        break;
      }
      case 'niveau': {
        if (!tree.selectedFormationId) return;
        const values = nivForm.getValues();
        if (editingId) {
          updateNiv.mutate({
            id: editingId,
            input: { code: values.code, libelle: values.libelle, originId: values.originId || undefined },
          });
        } else {
          createNiv.mutate({
            formationId: tree.selectedFormationId,
            code: values.code,
            libelle: values.libelle,
            originId: values.originId || undefined,
          });
        }
        break;
      }
      case 'groupe': {
        if (!tree.selectedNiveauId) return;
        if (!selectedSemestreId) return;
        const values = grpForm.getValues();
        if (editingId) {
          updateGrp.mutate({
            id: editingId,
            input: {
              code: values.code,
              libelle: values.libelle,
              effectif: values.effectif ? Number(values.effectif) : undefined,
              parentId: values.parentId || undefined,
            },
          });
        } else {
          createGrp.mutate({
            niveauId: tree.selectedNiveauId,
            semestreId: selectedSemestreId,
            type: values.type,
            code: values.code,
            libelle: values.libelle,
            effectif: values.effectif ? Number(values.effectif) : undefined,
            parentId: values.parentId || undefined,
          });
        }
        break;
      }
    }
    setOpenForm(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cet élément ?')) return;
    switch (mode) {
      case 'departement': deleteDep.mutate(id); break;
      case 'formation': deleteForm.mutate(id); break;
      case 'niveau': deleteNiv.mutate(id); break;
      case 'groupe': deleteGrp.mutate(id); break;
    }
  };

  const selectDepartement = useCallback((id: string) => {
    setTree((prev) => ({ ...prev, selectedDepartementId: id, selectedFormationId: null, selectedNiveauId: null, selectedGroupeId: null }));
  }, []);
  const selectFormation = useCallback((id: string) => {
    setTree((prev) => ({ ...prev, selectedFormationId: id, selectedNiveauId: null, selectedGroupeId: null }));
  }, []);
  const selectNiveau = useCallback((id: string) => {
    setTree((prev) => ({ ...prev, selectedNiveauId: id, selectedGroupeId: null }));
  }, []);

  const openCreateForm = (kind: EntityKind) => {
    setMode(kind);
    setEditingId(null);
    setOpenForm(true);
    depForm.reset({ code: '', libelle: '', originId: '' });
    formForm.reset({ code: '', libelle: '', originId: '' });
    nivForm.reset({ code: '', libelle: '', originId: '' });
    grpForm.reset({ code: '', libelle: '', type: 'SECTION', parentId: '', effectif: undefined });
  };

  const openEditForm = (kind: EntityKind, id: string, code: string, libelle: string) => {
    setMode(kind);
    setEditingId(id);
    setOpenForm(true);
    if (kind === 'departement') depForm.reset({ code, libelle, originId: '' });
    else if (kind === 'formation') formForm.reset({ code, libelle, originId: '' });
    else if (kind === 'niveau') nivForm.reset({ code, libelle, originId: '' });
    else if (kind === 'groupe') grpForm.reset({ code, libelle, type: 'SECTION', parentId: '', effectif: undefined });
  };

  return (
    <div className="space-y-6">
      {/* Sélecteurs année / semestre */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid size={20} /> {messages.structure}
          </h1>
          <p className="text-muted-foreground">
            {messages.departements} {'>'} {messages.formations} {'>'} {messages.niveaux} {'>'} {messages.groupes}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{messages.labelAnnee}</Label>
            <Select
              value={selectedAnneeId ?? ''}
              onValueChange={(val) => {
                setSelectedAnneeId(val || null);
                setSelectedSemestreId(null);
              }}
              disabled={annees.length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={messages.selectAnnee} />
              </SelectTrigger>
              <SelectContent>
                {annees.length === 0 ? (
                  <SelectItem disabled key="none">{messages.errorLoadStructure}</SelectItem>
                ) : (
                  annees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} ({a.numero})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedAnneeId && (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{messages.labelSemestre}</Label>
              <Select
                value={selectedSemestreId ?? ''}
                onValueChange={(val) => setSelectedSemestreId(val || null)}
                disabled={semestreList.length === 0}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={messages.selectSemestre} />
                </SelectTrigger>
                <SelectContent>
                  {semestreList.length === 0 ? (
                    <SelectItem disabled key="none">{messages.aucunSemestre}</SelectItem>
                  ) : (
                    semestreList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        Semestre {s.numero}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {!selectedAnneeId && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {messages.anneeRequired}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panneau 1 : Départements */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {messages.departements}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateForm('departement')}
                  disabled={!selectedAnneeId}
                  title={!selectedAnneeId ? messages.anneeRequired : undefined}
                >
                  <Plus size={14} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh]">
                <ul className="space-y-1">
                  {departements.length === 0 && (
                    <li className="p-3 text-sm text-muted-foreground text-center">{messages.aucunDepartement}</li>
                  )}
                  {departements.map((d) => (
                    <li
                      key={d.id}
                      className={`
                        p-2 border rounded hover:bg-muted/50 cursor-pointer flex items-center justify-between group
                        ${tree.selectedDepartementId === d.id ? 'bg-muted border-border' : ''}
                      `}
                      onClick={() => selectDepartement(d.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Folder size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium truncate w-16">{d.code}</span>
                        <span className="text-xs text-muted-foreground truncate">{d.libelle}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm('departement', d.id, d.code, d.libelle);
                          }}
                          aria-label={messages.editDepartement}
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                          aria-label={messages.deleteDepartement}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Panneau 2 : Formations */}
        {tree.selectedDepartementId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {messages.formations}
                  <Button size="sm" variant="outline" onClick={() => openCreateForm('formation')}>
                    <Plus size={14} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {formations.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">{messages.aucuneFormation}</li>
                    )}
                    {formations.map((f) => (
                      <li
                        key={f.id}
                        className={`
                          p-2 border rounded hover:bg-muted/50 cursor-pointer flex items-center justify-between group
                          ${tree.selectedFormationId === f.id ? 'bg-muted border-border' : ''}
                        `}
                        onClick={() => selectFormation(f.id)}
                      >
                        <div className="flex items-center gap-2">
                          <School size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium truncate w-16">{f.code}</span>
                          <span className="text-xs text-muted-foreground truncate">{f.libelle}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm('formation', f.id, f.code, f.libelle);
                            }}
                            aria-label={messages.editFormation}
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                            aria-label={messages.deleteFormation}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Panneau 3 : Niveaux */}
        {tree.selectedFormationId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {messages.niveaux}
                  <Button size="sm" variant="outline" onClick={() => openCreateForm('niveau')}>
                    <Plus size={14} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {niveaux.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">{messages.aucunNiveau}</li>
                    )}
                    {niveaux.map((n) => (
                      <li
                        key={n.id}
                        className={`
                          p-2 border rounded hover:bg-muted/50 cursor-pointer flex items-center justify-between group
                          ${tree.selectedNiveauId === n.id ? 'bg-muted border-border' : ''}
                        `}
                        onClick={() => selectNiveau(n.id)}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium truncate w-16">{n.code}</span>
                          <span className="text-xs text-muted-foreground truncate">{n.libelle}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm('niveau', n.id, n.code, n.libelle);
                            }}
                            aria-label={messages.editNiveau}
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                            aria-label={messages.deleteNiveau}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

                {/* Panneau 4 : Groupes */}
        {tree.selectedNiveauId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {messages.groupes}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateForm('groupe')}
                    disabled={!selectedSemestreId}
                    title={!selectedSemestreId ? messages.semestreRequired : undefined}
                  >
                    <Plus size={14} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {groupes.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">{messages.aucunGroupe}</li>
                    )}
                    {groupes.map((g) => (
                      <li key={g.id} className="p-2 border rounded hover:bg-muted/50 flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium truncate w-16">{g.code}</span>
                          <span className="text-xs text-muted-foreground truncate">{g.libelle}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${g.type === 'SECTION' ? 'bg-blue-100 text-blue-700' : g.type === 'GROUPE' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                            {g.type === 'SECTION' ? messages.typeSection : g.type === 'GROUPE' ? messages.typeGroupe : messages.typeSousGroupe}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm('groupe', g.id, g.code, g.libelle);
                            }}
                            aria-label={messages.editGroupe}
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}
                            aria-label={messages.deleteGroupe}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? messages.edit : messages.create}{' '}
              {mode === 'departement'
                ? messages.entityDepartement
                : mode === 'formation'
                ? messages.entityFormation
                : mode === 'niveau'
                ? messages.entityNiveau
                : messages.entityGroupe}
            </DialogTitle>
            <DialogDescription>
              {mode === 'groupe' ? messages.columnEffectif : messages.formCodePlaceholder}
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {mode === 'departement' && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnCode}</Label>
                  <Input {...depForm.register('code')} placeholder={messages.formCodePlaceholder} />
                  {depForm.formState.errors.code && (
                    <span className="text-xs text-destructive">{depForm.formState.errors.code.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnLibelle}</Label>
                  <Input {...depForm.register('libelle')} placeholder={messages.formLibellePlaceholder} />
                  {depForm.formState.errors.libelle && (
                    <span className="text-xs text-destructive">{depForm.formState.errors.libelle.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.labelOriginId}</Label>
                  <Input {...depForm.register('originId')} placeholder="UUID (optionnel)" />
                  {depForm.formState.errors.originId && (
                    <span className="text-xs text-destructive">{depForm.formState.errors.originId.message}</span>
                  )}
                </div>
              </>
            )}
            {mode === 'formation' && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnCode}</Label>
                  <Input {...formForm.register('code')} placeholder={messages.formCodePlaceholder} />
                  {formForm.formState.errors.code && (
                    <span className="text-xs text-destructive">{formForm.formState.errors.code.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnLibelle}</Label>
                  <Input {...formForm.register('libelle')} placeholder={messages.formLibellePlaceholder} />
                  {formForm.formState.errors.libelle && (
                    <span className="text-xs text-destructive">{formForm.formState.errors.libelle.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.labelOriginId}</Label>
                  <Input {...formForm.register('originId')} placeholder="UUID (optionnel)" />
                  {formForm.formState.errors.originId && (
                    <span className="text-xs text-destructive">{formForm.formState.errors.originId.message}</span>
                  )}
                </div>
              </>
            )}
            {mode === 'niveau' && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnCode}</Label>
                  <Input {...nivForm.register('code')} placeholder={messages.formCodePlaceholder} />
                  {nivForm.formState.errors.code && (
                    <span className="text-xs text-destructive">{nivForm.formState.errors.code.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnLibelle}</Label>
                  <Input {...nivForm.register('libelle')} placeholder={messages.formLibellePlaceholder} />
                  {nivForm.formState.errors.libelle && (
                    <span className="text-xs text-destructive">{nivForm.formState.errors.libelle.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.labelOriginId}</Label>
                  <Input {...nivForm.register('originId')} placeholder="UUID (optionnel)" />
                  {nivForm.formState.errors.originId && (
                    <span className="text-xs text-destructive">{nivForm.formState.errors.originId.message}</span>
                  )}
                </div>
              </>
            )}
            {mode === 'groupe' && (
              <>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.labelType}</Label>
                  <Select {...grpForm.register('type')} defaultValue="SECTION">
                    <SelectTrigger>
                      <SelectValue placeholder={messages.formSelectType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SECTION">{messages.typeSection}</SelectItem>
                      <SelectItem value="GROUPE">{messages.typeGroupe}</SelectItem>
                      <SelectItem value="SOUS_GROUPE">{messages.typeSousGroupe}</SelectItem>
                    </SelectContent>
                  </Select>
                  {grpForm.formState.errors.type && (
                    <span className="text-xs text-destructive">{grpForm.formState.errors.type.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnCode}</Label>
                  <Input {...grpForm.register('code')} placeholder="L1-INFO-G1" />
                  {grpForm.formState.errors.code && (
                    <span className="text-xs text-destructive">{grpForm.formState.errors.code.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnLibelle}</Label>
                  <Input {...grpForm.register('libelle')} placeholder={messages.formLibellePlaceholder} />
                  {grpForm.formState.errors.libelle && (
                    <span className="text-xs text-destructive">{grpForm.formState.errors.libelle.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnEffectif}</Label>
                  <Input {...grpForm.register('effectif')} type="number" placeholder={messages.formEffectif} />
                  {grpForm.formState.errors.effectif && (
                    <span className="text-xs text-destructive">{grpForm.formState.errors.effectif.message}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{messages.columnParent}</Label>
                  <Input {...grpForm.register('parentId')} placeholder="UUID du parent (optionnel)" />
                  {grpForm.formState.errors.parentId && (
                    <span className="text-xs text-destructive">{grpForm.formState.errors.parentId.message}</span>
                  )}
                </div>
              </>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
              {messages.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!selectedAnneeId && mode === 'departement'}>
              {messages.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
