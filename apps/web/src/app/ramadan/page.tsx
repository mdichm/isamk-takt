'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RamadanGrille } from '@/components/ramadan/RamadanGrille';
import { SemestreSelector } from '@/components/creneaux/SemestreSelector';
import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

function canWriteRamadan(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'GESTIONNAIRE',
    'DIRECTION',
    'RESPONSABLE_DEPARTEMENT',
  ].includes(role ?? '');
}

export default function RamadanPage() {
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>('');
  const role = getCurrentUserRole();
  const canWrite = canWriteRamadan(role);

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
            <h1 className="text-2xl font-bold">{messages.ramadan}</h1>
            <p className="text-muted-foreground">{messages.ramadanSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <SemestreSelector
              value={selectedSemestreId}
              onChange={setSelectedSemestreId}
              disabled={!canWrite}
            />
            {!canWrite && (
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {messages.errorForbidden}
              </span>
            )}
          </div>
        </div>

        {selectedSemestreId && (
          <RamadanGrille semestreId={selectedSemestreId} />
        )}
      </div>
    </QueryClientProvider>
  );
}
