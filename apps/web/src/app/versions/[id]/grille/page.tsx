'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { GrilleEdition } from '@/components/seances/grille-edition';
import { messages } from '@/lib/messages/fr';

const queryClient = new QueryClient();

export default function GrillePage() {
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
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{messages.grilleEditionTitre}</h1>
        <GrilleEdition versionId={id} />
      </div>
    </QueryClientProvider>
  );
}
