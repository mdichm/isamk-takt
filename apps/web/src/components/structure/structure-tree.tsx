'use client';

import { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Folder, School, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useDepartements, useCreateDepartement, useUpdateDepartement, useDeleteDepartement,
  useFormations, useCreateFormation, useUpdateFormation, useDeleteFormation,
  useNiveaux, useCreateNiveau, useUpdateNiveau, useDeleteNiveau,
  useGroupes, useCreateGroupe, useUpdateGroupe, useDeleteGroupe,
} from '@/hooks/use-structure';
import { Departement, Formation, Niveau, Groupe } from '@/lib/api/structure';
import { messages } from '@/lib/messages/fr';

type EntityKind = 'departement' | 'formation' | 'niveau' | 'groupe';

interface TreeState {
  selectedDepartementId: string | null;
  selectedFormationId: string | null;
  selectedNiveauId: string | null;
  selectedGroupeId: string | null;
}

export function StructureTree() {
  const [mode, setMode] = useState<EntityKind>('departement');
  const [entityForm, setEntityForm] = useState<{ code: string; libelle: string; [key: string]: string | number }>({ code: '', libelle: '' });
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeState>({
    selectedDepartementId: null,
    selectedFormationId: null,
    selectedNiveauId: null,
    selectedGroupeId: null,
  });

  /* ---------- Départements ---------- */
  const { data: departementsData, isLoading: depsLoading } = useDepartements({ limit: 100 });
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
  });
  const createGrp = useCreateGroupe();
  const updateGrp = useUpdateGroupe();
  const deleteGrp = useDeleteGroupe();

  if (depsLoading || formLoading || nivLoading || grpLoading) {
    return <div className="p-4">{messages.loading}</div>;
  }

  const departements: Departement[] = departementsData?.data ?? [];
  const formations: Formation[] = formationsData?.data ?? [];
  const niveaux: Niveau[] = niveauxData?.data ?? [];
  const groupes: Groupe[] = groupesData?.data ?? [];

  const handleSave = () => {
    switch (mode) {
      case 'departement':
        if (editingId) {
          updateDep.mutate({ id: editingId, input: { code: entityForm.code as string, libelle: entityForm.libelle as string } });
        } else {
          createDep.mutate({
            anneeId: '00000000-0000-0000-0000-000000000000',
            code: entityForm.code as string,
            libelle: entityForm.libelle as string,
          });
        }
        break;
      case 'formation':
        if (!tree.selectedDepartementId) return;
        if (editingId) {
          updateForm.mutate({ id: editingId, input: { code: entityForm.code as string, libelle: entityForm.libelle as string } });
        } else {
          createForm.mutate({
            departementId: tree.selectedDepartementId,
            code: entityForm.code as string,
            libelle: entityForm.libelle as string,
          });
        }
        break;
      case 'niveau':
        if (!tree.selectedFormationId) return;
        if (editingId) {
          updateNiv.mutate({ id: editingId, input: { code: entityForm.code as string, libelle: entityForm.libelle as string } });
        } else {
          createNiv.mutate({
            formationId: tree.selectedFormationId,
            code: entityForm.code as string,
            libelle: entityForm.libelle as string,
          });
        }
        break;
      case 'groupe':
        if (!tree.selectedNiveauId) return;
        if (editingId) {
          updateGrp.mutate({ id: editingId, input: { code: entityForm.code as string, libelle: entityForm.libelle as string } });
        } else {
          createGrp.mutate({
            niveauId: tree.selectedNiveauId,
            semestreId: '00000000-0000-0000-0000-000000000000',
            type: 'SECTION',
            code: entityForm.code as string,
            libelle: entityForm.libelle as string,
          });
        }
        break;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{messages.structure}</h1>
          <p className="text-muted-foreground">
            {messages.departements} {'>'} {messages.formations} {'>'} {messages.niveaux} {'>'} {messages.groupes}
          </p>
        </div>
        <Button onClick={() => { setMode('departement'); setEntityForm({ code: '', libelle: '' }); setEditingId(null); setOpenForm(true); }}>
          <Plus size={18} className="mr-2" />
          {messages.createDepartement}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panneau 1 : Départements */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{messages.departements}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh]">
                <ul className="space-y-1">
                  {departements.length === 0 && (
                    <li className="p-3 text-sm text-muted-foreground text-center">{messages.errorLoadStructure}</li>
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
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setMode('departement'); setEntityForm({ code: d.code, libelle: d.libelle }); setEditingId(d.id); setOpenForm(true); }} aria-label={messages.editDepartement}>
                          <Edit size={12} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} aria-label={messages.deleteDepartement}>
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
                <CardTitle>{messages.formations}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Button size="sm" onClick={() => { setMode('formation'); setEntityForm({ code: '', libelle: '' }); setEditingId(null); setOpenForm(true); }}>
                    <Plus size={14} />
                  </Button>
                </div>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {formations.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">Aucune formation</li>
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
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setMode('formation'); setEntityForm({ code: f.code, libelle: f.libelle }); setEditingId(f.id); setOpenForm(true); }} aria-label={messages.editFormation}>
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} aria-label={messages.deleteFormation}>
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
                <CardTitle>{messages.niveaux}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Button size="sm" onClick={() => { setMode('niveau'); setEntityForm({ code: '', libelle: '' }); setEditingId(null); setOpenForm(true); }}>
                    <Plus size={14} />
                  </Button>
                </div>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {niveaux.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">Aucun niveau</li>
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
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setMode('niveau'); setEntityForm({ code: n.code, libelle: n.libelle }); setEditingId(n.id); setOpenForm(true); }} aria-label={messages.editNiveau}>
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} aria-label={messages.deleteNiveau}>
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
                <CardTitle>{messages.groupes}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <Button size="sm" onClick={() => { setMode('groupe'); setEntityForm({ code: '', libelle: '' }); setEditingId(null); setOpenForm(true); }}>
                    <Plus size={14} />
                  </Button>
                </div>
                <ScrollArea className="h-[70vh]">
                  <ul className="space-y-1">
                    {groupes.length === 0 && (
                      <li className="p-3 text-sm text-muted-foreground text-center">Aucun groupe</li>
                    )}
                    {groupes.map((g) => (
                      <li key={g.id} className="p-2 border rounded hover:bg-muted/50 flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-muted-foreground" />
                          <span className="text-sm font-medium truncate w-16">{g.code}</span>
                          <span className="text-xs text-muted-foreground truncate">{g.libelle}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${g.type === 'SECTION' ? 'bg-blue-100 text-blue-700' : g.type === 'GROUPE' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                            {g.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setMode('groupe'); setEntityForm({ code: g.code, libelle: g.libelle }); setEditingId(g.id); setOpenForm(true); }} aria-label={messages.editGroupe}>
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }} aria-label={messages.deleteGroupe}>
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
              {editingId ? messages.editDepartement : messages.createDepartement}
            </DialogTitle>
            <DialogDescription>{messages.formCodePlaceholder}</DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-1">
              <Label className="text-sm font-medium">{messages.columnCode}</Label>
              <Input
                value={entityForm.code as string}
                onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value })}
                placeholder={messages.formCodePlaceholder}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">{messages.columnLibelle}</Label>
              <Input
                value={entityForm.libelle as string}
                onChange={(e) => setEntityForm({ ...entityForm, libelle: e.target.value })}
                placeholder={messages.formLibellePlaceholder}
                required
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
              {messages.cancel}
            </Button>
            <Button onClick={handleSave}>{messages.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
