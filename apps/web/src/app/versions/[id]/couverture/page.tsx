'use client';

import { useParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompletudeTable } from '@/components/versions/completude-table';
import { useCompletude } from '@/hooks/use-completude';
import { messages } from '@/lib/messages/fr';

const queryClient = new QueryClient();

export default function CouverturePage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">Identifiant de version manquant.</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CouverturePageContent versionId={id} />
    </QueryClientProvider>
  );
}

function CouverturePageContent({ versionId }: { versionId: string }) {
  const { data, isLoading, error } = useCompletude(versionId);

  return (
    <div className="p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">{messages.couverturePageTitre}</h1>
      <p className="text-sm text-muted-foreground mb-6">{messages.couverturePageSousTitre}</p>
      <CompletudeTable
        data={data}
        isLoading={isLoading}
        error={error}
        versionId={versionId}
      />
    </div>
  );
}
