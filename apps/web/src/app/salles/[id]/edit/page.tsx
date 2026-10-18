'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSalle } from '@/hooks/use-salles';
import { SalleFormDialog } from '@/components/salles/salle-form-dialog';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const queryClient = new QueryClient();

function SalleEditContent({ id }: { id: string }) {
  const { data: salle, isPending, error } = useSalle(id);
  const [formOpen, setFormOpen] = useState(true);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">{getErrorMessage(error) || messages.errorSalleNotFound}</p>
      </div>
    );
  }

  if (isPending || !salle) {
    return <div className="p-4 flex items-center justify-center">{messages.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.editSalle}</h1>
          <p className="text-muted-foreground">
            {messages.editSalleDesc} ({salle.code})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/salles/${salle.id}`}>
            <Button variant="outline">
              <ArrowLeft size={18} className="mr-2" />
              {messages.cancel}
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.editSalle}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalleFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            salleToEdit={salle}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SalleEditPage({ params }: { params: { id: string } }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SalleEditContent id={params.id} />
    </QueryClientProvider>
  );
}
