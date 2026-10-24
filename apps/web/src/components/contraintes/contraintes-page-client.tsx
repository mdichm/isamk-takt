'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { messages } from '@/lib/messages/fr';
import { ContraintesTable } from '@/components/contraintes/contraintes-table';
import { ContrainteFormDialog } from '@/components/contraintes/contrainte-form-dialog';
import { FetMappingPreview } from '@/components/contraintes/fet-mapping-preview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/auth';

const queryClient = new QueryClient();

function canCreateContrainte(role: string | undefined): boolean {
  return [
    'ADMINISTRATEUR',
    'GESTIONNAIRE',
    'DIRECTION',
  ].includes(role ?? '');
}

export function ContraintesPageClient({
  semestreId,
}: {
  semestreId?: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const role = getCurrentUserRole();
  const canCreate = canCreateContrainte(role);

  if (role === undefined) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.contraintes}</h1>
            <p className="text-muted-foreground">
              {messages.contraintesSubtitle}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={18} className="mr-2" />
              {messages.create} {messages.entityContrainteInstance}
            </Button>
          )}
          {!canCreate && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {messages.errorForbidden}
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{messages.instancesContraintes}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContraintesTable />
          </CardContent>
        </Card>

        {semestreId ? (
          <Card>
            <CardHeader>
              <CardTitle>{messages.fetMappingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FetMappingPreview semestreId={semestreId} />
              <p className="text-xs text-muted-foreground">
                {messages.fetMappingNote}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{messages.fetMappingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-muted-foreground text-sm">
              {messages.semestreSelectionRequired}
            </CardContent>
          </Card>
        )}

        <ContrainteFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    </QueryClientProvider>
  );
}