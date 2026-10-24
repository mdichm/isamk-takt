'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SemestreSelector } from '@/components/creneaux/SemestreSelector';
import { ExigencesSalleTable } from '@/components/exigences-salle/exigences-salle-table';
import { ExigenceSalleFormDialog } from '@/components/exigences-salle/exigence-salle-form-dialog';
import { useAnnees } from '@/hooks/use-structure';
import { getCurrentUserRole } from '@/lib/auth';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ExigenceSalleActivite } from '@/lib/api/exigences-salle';

const queryClient = new QueryClient();

export default function ExigencesSallePage() {
  const [anneeId, setAnneeId] = useState<string>('');
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<ExigenceSalleActivite | undefined>();
  const role = getCurrentUserRole();
  const canWrite = role === 'ADMINISTRATEUR' || role === 'GESTIONNAIRE';

  const { data: anneesResult } = useAnnees({ limit: 50 });
  const annees = anneesResult ?? [];

  const handleSave = async (exigence: ExigenceSalleActivite) => {
    void exigence;
    setOpenDialog(false);
    setEditing(undefined);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.exigencesSalle}</h1>
            <p className="text-muted-foreground">{messages.exigencesSalleSubtitle}</p>
          </div>
          {!canWrite && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {messages.errorForbidden}
            </span>
          )}
          {canWrite && (
            <Button onClick={() => setOpenDialog(true)}>
              <Plus size={18} className="mr-2" />
              {messages.create} {messages.entityExigenceSalle}
            </Button>
          )}
        </div>

        {role === undefined && (
          <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
            {messages.loading}
          </div>
        )}

        {!canWrite && role !== undefined && (
          <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
            {messages.infoLectureSeule}
          </div>
        )}

        {canWrite && role !== undefined && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{messages.covoiturageSelectAnnee}</label>
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

            {selectedSemestreId && (
              <ExigencesSalleTable
                semestreId={selectedSemestreId}
                canWrite={canWrite}
                onEdit={(e) => {
                  setEditing(e);
                  setOpenDialog(true);
                }}
              />
            )}
          </>
        )}

        <ExigenceSalleFormDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          semestreId={selectedSemestreId}
          exigenceToEdit={editing}
          onSave={handleSave}
        />
      </div>
    </QueryClientProvider>
  );
}
