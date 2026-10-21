'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RepartitionAffectationsTable } from '@/components/repartitions/repartition-affectations-table';
import { messages } from '@/lib/messages/fr';

export default function RepartitionPage({ params }: { params: { id: string } }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{messages.affectations}</h1>
        <p className="text-muted-foreground mb-6">{messages.affectationsSubtitle}</p>
        <RepartitionAffectationsTable repartitionId={params.id} />
      </div>
    </QueryClientProvider>
  );
}
