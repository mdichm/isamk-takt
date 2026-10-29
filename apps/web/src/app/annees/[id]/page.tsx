'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnneeClotureDialog } from '@/components/annees/annee-cloture-dialog';
import { findAnneeById, type Annee } from '@/lib/api/annees';
import { messages } from '@/lib/messages/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getErrorMessage } from '@/lib/api/errors';
import { useToast } from '@/components/ui/use-toast';

const ANNEES_QUERY_KEY = (id: string) => ['annee', id] as const;

function statutLabel(statut: Annee['statut']): string {
  switch (statut) {
    case 'PREPARATION':
      return messages.statutPreparation;
    case 'ACTIVE':
      return messages.statutActive;
    case 'CLOTUREE':
      return messages.statutCloturee;
    default:
      return statut;
  }
}

export default function AnneePage({ params }: { params: { id: string } }) {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: annee, isLoading, error } = useQuery<Annee, Error>({
    queryKey: ANNEES_QUERY_KEY(params.id),
    queryFn: () => findAnneeById(params.id),
  });

  const estActive = annee?.statut === 'ACTIVE';

  const handleCloturee = () => {
    toast({
      title: messages.clotureSucces,
      variant: 'default',
    });
    queryClient.invalidateQueries({ queryKey: ANNEES_QUERY_KEY(params.id) });
    setDialogOpen(false);
    router.refresh();
  };

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{messages.labelAnnee}</h1>
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </QueryClientProvider>
    );
  }

  if (error || !annee) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{messages.labelAnnee}</h1>
          <p className="text-destructive">
            {getErrorMessage(error) || messages.error}
          </p>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{annee.code}</h1>
            <p className="text-muted-foreground">
              Année universitaire {annee.numero} · {annee.nbSemaines} semaine(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={estActive ? 'default' : 'secondary'}>
              {statutLabel(annee.statut)}
            </Badge>
            {annee.statut === 'CLOTUREE' && (
              <Badge variant="destructive" className="text-xs">
                {messages.anneeLectureSeule}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Détails de l’année</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium">{statutLabel(annee.statut)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono font-medium">{annee.code}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Nombre de semaines</span>
                <span className="font-medium">{annee.nbSemaines}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Année n°</span>
                <span className="font-medium">{annee.numero}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center gap-3">
          {annee.statut !== 'CLOTUREE' && (
            <AnneeClotureDialog
              annee={annee}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onCloturee={handleCloturee}
            />
          )}
          {annee.statut === 'CLOTUREE' && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 mb-4">
              <h3 className="font-semibold text-destructive">{messages.anneeLectureSeule}</h3>
              <p className="text-sm text-destructive/80">{messages.anneeLectureSeuleDescription}</p>
            </div>
          )}
        </div>

      </div>
    </QueryClientProvider>
  );
}
