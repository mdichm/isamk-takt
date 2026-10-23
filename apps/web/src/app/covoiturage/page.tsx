'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query';
import { SemestreSelector } from '@/components/creneaux/SemestreSelector';
import { CovoiturageList } from '@/components/covoiturage/covoiturage-list';
import { CovoiturageFormDialog } from '@/components/covoiturage/covoiturage-form-dialog';
import {
  listCovoiturageGroupes,
  createCovoiturageGroupe,
  updateCovoiturageGroupe,
  deleteCovoiturageGroupe,
  type CovoiturageGroupe,
} from '@/lib/api/covoiturage';
import { useAnnees } from '@/hooks/use-structure';
import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

export default function CovoituragePage() {
  const [anneeId, setAnneeId] = useState<string>('');
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<CovoiturageGroupe | undefined>();
  const role = getCurrentUserRole();
  const canWrite = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  const { data: anneesResult } = useAnnees({ limit: 50 });
  const annees = anneesResult ?? [];

  const groupesQuery = useQuery({
    queryKey: ['covoiturage-groupes', selectedSemestreId],
    queryFn: () =>
      listCovoiturageGroupes({ semestreId: selectedSemestreId }).then(
        (r) => r.data,
      ),
    enabled: canWrite && !!selectedSemestreId,
  });
  const groupes = groupesQuery.data ?? [];
  const loading = groupesQuery.isFetching;

  const createMutation = useMutation({
    mutationFn: createCovoiturageGroupe,
    onSuccess: () => {
      void groupesQuery.refetch();
      setOpenDialog(false);
      setEditing(undefined);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CovoiturageGroupe> }) =>
      updateCovoiturageGroupe(id, input),
    onSuccess: () => {
      void groupesQuery.refetch();
      setOpenDialog(false);
      setEditing(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCovoiturageGroupe,
    onSuccess: () => {
      void groupesQuery.refetch();
    },
  });

  const handleSave = async (payload: {
    semestreId: string;
    enseignantIds: string[];
    margeMinutes: number;
    joursCommunsMin: number;
    strict: boolean;
  }) => {
    if (editing) {
      void updateMutation.mutate({
        id: editing.id,
        input: {
          enseignantIds: payload.enseignantIds,
          margeMinutes: payload.margeMinutes,
          joursCommunsMin: payload.joursCommunsMin,
          strict: payload.strict,
        },
      });
    } else {
      void createMutation.mutate({
        semestreId: payload.semestreId,
        enseignantIds: payload.enseignantIds,
        margeMinutes: payload.margeMinutes,
        joursCommunsMin: payload.joursCommunsMin,
        strict: payload.strict,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(messages.confirmDeleteGroupe)) return;
    void deleteMutation.mutate(id);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.covoiturage}</h1>
            <p className="text-muted-foreground">{messages.covoiturageSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {!canWrite && (
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {messages.errorForbidden}
              </span>
            )}
            {canWrite && (
              <CovoiturageFormDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                semestreId={selectedSemestreId}
                groupe={editing}
                onSave={handleSave}
              />
            )}
          </div>
        </div>

        {role === undefined && (
          <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
            {messages.loading}
          </div>
        )}

        {!canWrite && role !== undefined && (
          <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
            {messages.errorCovoiturageForbidden}
          </div>
        )}

        {canWrite && role !== undefined && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                {messages.covoiturageSelectAnnee}
              </label>
              <select
                value={anneeId}
                onChange={(evt) => {
                  setAnneeId(evt.target.value);
                  setSelectedSemestreId('');
                }}
                className="border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">{messages.covoiturageSelectAnnee}</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} ({a.numero})
                  </option>
                ))}
              </select>
              {anneeId && (
                <SemestreSelector
                  anneeId={anneeId}
                  value={selectedSemestreId}
                  onChange={setSelectedSemestreId}
                  disabled={!canWrite}
                />
              )}
            </div>

            {loading && (
              <p className="text-xs text-muted-foreground">
                {messages.loadingGroupes}
              </p>
            )}

            {selectedSemestreId && (
              <CovoiturageList
                groupes={groupes}
                onEdit={(g) => {
                  setEditing(g);
                  setOpenDialog(true);
                }}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </QueryClientProvider>
  );
}

