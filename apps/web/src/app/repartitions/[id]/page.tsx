'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use, useEffect, useState } from 'react';
import { RepartitionAffectationsTable } from '@/components/repartitions/repartition-affectations-table';
import { findRepartition } from '@/lib/api/repartitions';
import { findVersions } from '@/lib/api/versions';
import { messages } from '@/lib/messages/fr';
import { getErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/components/ui/use-toast';

export default function RepartitionPage({ params }: { params: Promise<{ id: string }> }) {
  // En Next.js 15+, `params` est une Promise : elle doit être déballée via `use()`.
  const { id } = use(params);
  const [queryClient] = useState(() => new QueryClient());
  const [versionId, setVersionId] = useState<string | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function loadVersion() {
      try {
        const repartition = await findRepartition(id);
        const versions = await findVersions();
        const version = versions.find((v) => v.semestreId === repartition.semestreId);
        if (!cancelled) {
          setVersionId(version?.id ?? null);
          setIsLoadingVersion(false);
        }
      } catch (error) {
        if (!cancelled) {
          setIsLoadingVersion(false);
          toast({
            title: messages.error,
            description: getErrorMessage(error) || messages.errorLoadAffectations,
            variant: 'destructive',
          });
        }
      }
    }
    loadVersion();
    return () => { cancelled = true; };
  }, [id, toast]);

  if (isLoadingVersion) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{messages.affectations}</h1>
          <p className="text-muted-foreground mb-6">{messages.affectationsSubtitle}</p>
          <p className="text-muted-foreground">Chargement de la version…</p>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{messages.affectations}</h1>
        <p className="text-muted-foreground mb-6">{messages.affectationsSubtitle}</p>
        <RepartitionAffectationsTable
          repartitionId={id}
          versionId={versionId}
        />
      </div>
    </QueryClientProvider>
  );
}
