'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SallesTable } from '@/components/salles/salles-table';
import { SalleFormDialog } from '@/components/salles/salle-form-dialog';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

function canCreateSalle(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'GESTIONNAIRE',
    'DIRECTION',
    'RESPONSABLE_DEPARTEMENT',
  ].includes(role ?? '');
}

export default function SallesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const role = getCurrentUserRole();
  const canCreate = canCreateSalle(role);

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
            <h1 className="text-2xl font-bold">{messages.salles}</h1>
            <p className="text-muted-foreground">
              {messages.sallesSubtitle}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={18} className="mr-2" />
              {messages.create} {messages.entitySalle}
            </Button>
          )}
          {!canCreate && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {messages.errorForbidden}
            </span>
          )}
        </div>

        <SallesTable />

        <SalleFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    </QueryClientProvider>
  );
}
