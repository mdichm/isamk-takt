'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RepartitionsTable } from '@/components/repartitions/repartitions-table';
import { t } from '@/lib/i18n';

export default function RepartitionsPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('repartitionsTitle')}</h1>
        <p className="text-muted-foreground mb-6">{t('repartitionsSubtitle')}</p>
        <RepartitionsTable />
      </div>
    </QueryClientProvider>
  );
}