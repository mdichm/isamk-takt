'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/components/shell/AuthProvider';
import { messages } from '@/lib/messages/fr';
import { DemandesTable } from '@/components/demandes/demandes-table';
import { DemandeFormDialog } from '@/components/demandes/demande-form-dialog';

export default function DemandesPage() {
  const [queryClient] = useState(() => new QueryClient());
  const { role } = useAuth();
  const [formOpen, setFormOpen] = useState(false);

  const canCreate =
    role === 'GESTIONNAIRE' ||
    role === 'ADMINISTRATEUR' ||
    role === 'DIRECTION';
  const canTraiter =
    role === 'ADMINISTRATEUR' ||
    role === 'DIRECTION' ||
    role === 'RESPONSABLE_DEPARTEMENT';

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{messages.demandes}</h1>
            <p className="text-muted-foreground">{messages.demandesSubtitle}</p>
          </div>
        </div>
        <DemandesTable canCreate={canCreate} canTraiter={canTraiter} />
        <DemandeFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      </div>
    </QueryClientProvider>
  );
}
