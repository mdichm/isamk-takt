'use client';

import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages/fr';
import { Trash2, Plus, Edit2, Lock, Unlock, History } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useAffectations, useCreateAffectation, useUpdateAffectation, useDeleteAffectation,
} from '@/hooks/use-affectations';
import type { Affectation } from '@/lib/api/repartitions';
import { AffectationFormDialog } from './affectation-form-dialog';
import { AffectationDeleteDialog } from './affectation-delete-dialog';
import {
  findSeancesByVersion,
  type Seance,
} from '@/lib/api/seances';
import {
  listVerrousSeance,
  type VerrouSeance,
} from '@/lib/api/verrous';
import {
  PoseVerrouDialog,
  VerrouLevePreviewDialog,
  VerrouHistoriqueDialog,
} from '@/components/verrous';
interface RepartitionAffectationsTableProps {
  repartitionId: string;
  versionId: string | null;
}

export function RepartitionAffectationsTable({ repartitionId, versionId }: RepartitionAffectationsTableProps) {
  const [query, setQuery] = useState<{ page: number; limit: number }>({
    page: 1, limit: 20,
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openPose, setOpenPose] = useState(false);
  const [openLeve, setOpenLeve] = useState(false);
  const [openHistorique, setOpenHistorique] = useState(false);
  const [editAffectation, setEditAffectation] = useState<Affectation | null>(null);
  const [deleteAffectation, setDeleteAffectation] = useState<Affectation | null>(null);
  const [poseTarget, setPoseTarget] = useState<{ seanceId: string; versionId: string } | null>(null);
  const [leveTarget, setLeveTarget] = useState<{ seanceId: string; versionId: string; verrous: VerrouSeance[] } | null>(null);
  const [historiqueTarget, setHistoriqueTarget] = useState<{ seanceId: string; verrous: VerrouSeance[] } | null>(null);
  const [seances, setSeances] = useState<Seance[]>([]);

  const { data, isPending, error } = useAffectations(repartitionId, query);
  const createMutation = useCreateAffectation();
  const updateMutation = useUpdateAffectation();
  const deleteMutation = useDeleteAffectation();
  const { toast } = useToast();

  // Charger les séances de la version pour faire le lien affectation → séance
  useEffect(() => {
    if (!versionId) return;
    let cancelled = false;
    findSeancesByVersion(versionId, { limit: 1000 })
      .then((result) => {
        if (!cancelled) setSeances(result.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [versionId]);

  const affectationKey = (a: Affectation): string => {
    if (a.estCmCommun) {
      return `cm:${a.moduleId}:${a.typeEnseignementId}:${a.enseignantId}`;
    }
    return `${a.groupeId ?? ''}:${a.moduleId}:${a.typeEnseignementId}:${a.enseignantId}`;
  };

  const seancesForAffectation = (a: Affectation): Seance[] => {
    const key = affectationKey(a);
    return seances.filter((s) => s.affectationKey === key);
  };

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadAffectations,
      variant: 'destructive',
    });
  }

  const affectations = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  const handleCreate = () => {
    setEditAffectation(null);
    setOpenCreate(true);
  };

  const handleEdit = (a: Affectation) => {
    setEditAffectation(a);
    setOpenEdit(true);
  };

  const handleDelete = (a: Affectation) => {
    setDeleteAffectation(a);
    setOpenDelete(true);
  };

  const handlePose = (a: Affectation) => {
    const s = seancesForAffectation(a)[0];
    if (s && versionId) {
      setPoseTarget({ seanceId: s.id, versionId });
      setOpenPose(true);
    }
  };

  const handleLeve = (a: Affectation) => {
    const ss = seancesForAffectation(a);
    if (ss.length > 0 && versionId) {
      listVerrousSeance(versionId, ss[0].id)
        .then((vs) => {
          const actif = vs.filter((v) => !v.leveLe);
          if (actif.length > 0) {
            setLeveTarget({ seanceId: ss[0].id, versionId, verrous: actif });
            setOpenLeve(true);
          } else {
            toast({ description: 'Aucun verrou actif à lever sur cette séance.' });
          }
        })
        .catch(() => {
          toast({ variant: 'destructive', description: messages.errorListVerrous });
        });
    }
  };

  const handleHistorique = (a: Affectation) => {
    const ss = seancesForAffectation(a);
    if (ss.length > 0 && versionId) {
      listVerrousSeance(versionId, ss[0].id)
        .then((vs) => {
          setHistoriqueTarget({ seanceId: ss[0].id, verrous: vs });
          setOpenHistorique(true);
        })
        .catch(() => {
          toast({ variant: 'destructive', description: messages.errorListVerrous });
        });
    }
  };

  const handlePoseSuccess = () => {
    setOpenPose(false);
    setPoseTarget(null);
    if (versionId) {
      findSeancesByVersion(versionId, { limit: 1000 })
        .then((result) => setSeances(result.data));
    }
  };

  const handleLeveSuccess = () => {
    setOpenLeve(false);
    setLeveTarget(null);
    if (versionId) {
      findSeancesByVersion(versionId, { limit: 1000 })
        .then((result) => setSeances(result.data));
    }
  };

  const handleHistoriqueClose = () => {
    setOpenHistorique(false);
    setHistoriqueTarget(null);
  };

  const handleSuccess = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditAffectation(null);
    setDeleteAffectation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.affectations}</h1>
          <p className="text-muted-foreground">{messages.affectationsSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            <span className="flex items-center gap-2">
              <Plus size={18} className="mr-2" />
              {messages.createAffectation}
            </span>
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader className="w-1/4">{messages.columnGroupe}</TableHeader>
              <TableHeader className="w-1/4">{messages.columnModule}</TableHeader>
              <TableHeader>{messages.columnTypeEnseignement}</TableHeader>
              <TableHeader>{messages.columnEnseignant}</TableHeader>
              <TableHeader className="text-right">{messages.columnActivityTag}</TableHeader>
              <TableHeader className="text-right">{messages.columnVolumeHebdo}</TableHeader>
              <TableHeader className="text-right">{messages.columnSeances}</TableHeader>
              <TableHeader className="text-right">{messages.columnDuree}</TableHeader>
              <TableHeader className="text-right">{messages.columnEcart}</TableHeader>
              <TableHeader className="text-right">{messages.columnVerrou}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affectations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  {messages.noAffectations}
                </TableCell>
              </TableRow>
            ) : (
              affectations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.groupeId ?? '—'}</TableCell>
                  <TableCell>{a.moduleId}</TableCell>
                  <TableCell>{a.typeEnseignementId}</TableCell>
                  <TableCell>{a.enseignantId}</TableCell>
                  <TableCell className="text-right">{a.activityTagId ?? '—'}</TableCell>
                  <TableCell className="text-right font-mono">{a.volumeHebdoMinutes} min</TableCell>
                  <TableCell className="text-right">{a.seancesParSemaine}</TableCell>
                  <TableCell className="text-right">{a.dureeMinutes} min</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">
                    {versionId ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePose(a)}
                          disabled={!!poseTarget?.seanceId || deleteMutation.isPending || updateMutation.isPending}
                          title={messages.verrouPose}
                        >
                          <Lock size={12} className="mr-1 shrink-0" />
                          {messages.verrouPose}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeve(a)}
                          disabled={!!leveTarget?.seanceId || deleteMutation.isPending || updateMutation.isPending}
                          title={messages.verrouLeve}
                        >
                          <Unlock size={12} className="mr-1 shrink-0" />
                          {messages.verrouLeve}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleHistorique(a)}
                          disabled={!!historiqueTarget?.seanceId || deleteMutation.isPending || updateMutation.isPending}
                          title={messages.verrouHistorique}
                        >
                          <History size={12} className="mr-1 shrink-0" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(a)} disabled={updateMutation.isPending || deleteMutation.isPending}>
                      <Edit2 size={14} className="mr-1" />
                      {messages.btnEditer}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(a)} disabled={updateMutation.isPending || deleteMutation.isPending} className="text-destructive">
                      <Trash2 size={14} className="mr-1" />
                      {messages.btnSupprimer}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {messages.noAffectations}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total : {total}</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={(query.page ?? 1) === 1 || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
            >Précédent</Button>
            <span className="text-xs text-muted-foreground">
              {query.page} / {totalPages}
            </span>
            <Button
              size="sm"
              disabled={(query.page ?? 1) >= totalPages || isPending}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
            >Suivant</Button>
          </div>
        </div>
      )}

      <AffectationFormDialog
        open={openCreate || openEdit}
        onOpenChange={(open) => {
          if (!open) { setOpenCreate(false); setOpenEdit(false); setEditAffectation(null); }
        }}
        repartitionId={repartitionId}
        affectationToEdit={openEdit ? (editAffectation ?? undefined) : undefined}
        onSuccess={handleSuccess}
      />

      <AffectationDeleteDialog
        open={openDelete}
        onOpenChange={(open) => { if (!open) setDeleteAffectation(null); }}
        affectation={deleteAffectation}
        onSuccess={handleSuccess}
      />

      {versionId && poseTarget && (
        <PoseVerrouDialog
          open={openPose}
          onOpenChange={(open) => {
            if (!open) setOpenPose(false);
            setPoseTarget(null);
          }}
          versionId={poseTarget.versionId}
          seanceId={poseTarget.seanceId}
          onSuccess={handlePoseSuccess}
        />
      )}

      {versionId && leveTarget && (
        <VerrouLevePreviewDialog
          open={openLeve}
          onOpenChange={(open) => {
            if (!open) {
              setOpenLeve(false);
              setLeveTarget(null);
            }
          }}
          verrouId={leveTarget.verrous[0]?.id ?? ''}
          verrouType={leveTarget.verrous[0]?.type ?? 'CRENEAU'}
          onSuccess={handleLeveSuccess}
        />
      )}

      {historiqueTarget && (
        <VerrouHistoriqueDialog
          open={openHistorique}
          onOpenChange={handleHistoriqueClose}
          verrous={historiqueTarget.verrous}
        />
      )}
    </div>
  );
}