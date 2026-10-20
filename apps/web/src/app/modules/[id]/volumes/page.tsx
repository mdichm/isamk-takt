'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VolumesTable } from '@/components/volumes/volumes-table';
import { VolumeFormDialog } from '@/components/volumes/volume-form-dialog';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

function canWriteVolume(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'RESPONSABLE_DEPARTEMENT',
  ].includes(role ?? '');
}

function VolumesPageContent({ moduleId }: { moduleId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const role = getCurrentUserRole();
  const canWrite = canWriteVolume(role);

  if (role === undefined) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.volumes}</h1>
          <p className="text-muted-foreground">{messages.volumesSubtitle}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} className="mr-2" />
            {messages.create} {messages.entityVolume}
          </Button>
        )}
        {!canWrite && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {messages.errorForbidden}
          </span>
        )}
      </div>

      <VolumesTable moduleId={moduleId} />

      <VolumeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        moduleId={moduleId}
      />
    </div>
  );
}

export default function VolumesPage({ params }: { params: { id: string } }) {
  return (
    <QueryClientProvider client={queryClient}>
      <VolumesPageContent moduleId={params.id} />
    </QueryClientProvider>
  );
}
