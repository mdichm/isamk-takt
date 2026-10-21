'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChargeGlobale } from '@/hooks/use-charges';
import { ChargeGlobaleTable } from '@/components/charges/charge-globale-table';
import { messages } from '@/lib/messages/fr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const queryClient = new QueryClient();

export default function ChargeGlobalePage({
  params,
}: {
  params: { id: string };
}) {
  const { data, isPending, error } = useChargeGlobale(params.id);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">{messages.errorLoadCharges}</p>
      </div>
    );
  }

  if (isPending || !data) {
    return <div className="p-4 flex items-center justify-center">{messages.loading}</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{messages.chargeGlobale}</h1>
            <p className="text-muted-foreground">
              {messages.chargeGlobaleSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/enseignants/${params.id}`}>
              <Button size="sm" variant="outline">
                <ArrowLeft size={18} className="mr-2" />
                {messages.retourEnseignant}
              </Button>
            </Link>
          </div>
        </div>

        <ChargeGlobaleTable charge={data} />
      </div>
    </QueryClientProvider>
  );
}