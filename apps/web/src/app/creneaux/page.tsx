'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreneauxTable } from '@/components/creneaux/CreneauxTable';
import { CreneauFormDialog } from '@/components/creneaux/CreneauFormDialog';
import { IndisponibilitesTable } from '@/components/creneaux/IndisponibilitesTable';
import { IndisponibiliteFormDialog } from '@/components/creneaux/IndisponibiliteFormDialog';
import { GrilleHoraire } from '@/components/creneaux/GrilleHoraire';
import { SemestreSelector } from '@/components/creneaux/SemestreSelector';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

function canWriteCreneau(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'GESTIONNAIRE',
    'DIRECTION',
    'RESPONSABLE_DEPARTEMENT',
  ].includes(role ?? '');
}

export default function CreneauxPage() {
  const [createCreneauOpen, setCreateCreneauOpen] = useState(false);
  const [createIndisponibiliteOpen, setCreateIndisponibiliteOpen] = useState(false);
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>('');
  const role = getCurrentUserRole();
  const canWrite = canWriteCreneau(role);

  if (role === undefined) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.creneaux}</h1>
            <p className="text-muted-foreground">
              {messages.creneauxSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SemestreSelector
              value={selectedSemestreId}
              onChange={setSelectedSemestreId}
              disabled={!canWrite}
            />
            {canWrite && (
              <Button onClick={() => setCreateCreneauOpen(true)}>
                <Plus size={18} className="mr-2" />
                {messages.create} {messages.entityCreneau}
              </Button>
            )}
            {canWrite && (
              <Button onClick={() => setCreateIndisponibiliteOpen(true)} variant="outline">
                <Plus size={18} className="mr-2" />
                {messages.create} {messages.entityIndisponibilite}
              </Button>
            )}
            {!canWrite && (
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {messages.errorForbidden}
              </span>
            )}
          </div>
        </div>

        {selectedSemestreId && (
          <GrilleHoraire semestreId={selectedSemestreId} />
        )}

        <CreneauxTable />

        <IndisponibilitesTable />

        <CreneauFormDialog
          open={createCreneauOpen}
          onOpenChange={setCreateCreneauOpen}
        />

        <IndisponibiliteFormDialog
          open={createIndisponibiliteOpen}
          onOpenChange={setCreateIndisponibiliteOpen}
        />
      </div>
    </QueryClientProvider>
  );
}
