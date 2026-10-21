'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ChargesTable } from '@/components/charges/charges-table';
import { messages } from '@/lib/messages/fr';

export default function ChargesPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{messages.charges}</h1>
        <p className="text-muted-foreground mb-6">{messages.chargesSubtitle}</p>
        <ChargesTable />
      </div>
    </QueryClientProvider>
  );
}
