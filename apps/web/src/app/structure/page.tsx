'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { StructureTree } from '@/components/structure/structure-tree';

export default function StructurePage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <StructureTree />
      </div>
    </QueryClientProvider>
  );
}