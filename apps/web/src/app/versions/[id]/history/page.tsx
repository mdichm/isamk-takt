'use client';

import { useParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useHistory } from '@/hooks/use-history';
import { messages } from '@/lib/messages/fr';

const queryClient = new QueryClient();

export default function HistoriqueVersionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          Identifiant de version manquant.
        </p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HistoriqueVersionPageContent versionId={id} />
    </QueryClientProvider>
  );
}

function statutBadge(statut: string) {
  const variants: Record<string, string> = {
    BROUILLON: 'bg-secondary text-secondary-foreground',
    EDITION: 'bg-blue-100 text-blue-900',
    PRET_POUR_VALIDATION: 'bg-amber-100 text-amber-900',
    EN_VALIDATION: 'bg-blue-100 text-blue-900',
    PUBLIE: 'bg-green-100 text-green-900',
    ARCHIVE: 'bg-slate-100 text-slate-900',
    REJETE: 'bg-red-100 text-red-900',
    CORRECTION: 'bg-orange-100 text-orange-900',
  };
  const labels: Record<string, string> = {
    BROUILLON: messages.statutBrouillon,
    EDITION: messages.statutEdition,
    PRET_POUR_VALIDATION: messages.statutPret,
    EN_VALIDATION: messages.statutValidation,
    PUBLIE: messages.statutPubliee,
    ARCHIVE: messages.statutArchivee,
    REJETE: messages.statutRejetee,
    CORRECTION: messages.statutCorrection,
  };
  return (
    <Badge variant={variants[statut] ? 'default' : 'secondary'} className={variants[statut]}>
      {labels[statut] ?? statut}
    </Badge>
  );
}

function HistoriqueVersionPageContent({ versionId }: { versionId: string }) {
  const { data, isLoading, error } = useHistory(versionId);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{messages.historiqueVersion}</h1>
        <p className="text-muted-foreground">{messages.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">{messages.errorGeneric}</p>
      </div>
    );
  }

  const entries = data?.entries ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{messages.historiqueVersion}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {messages.historiqueVersionSousTitre}
      </p>

      {entries.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          {messages.historiqueVide}
        </div>
      ) : (
        <Table>
          <caption className="text-left font-medium text-muted-foreground mb-2">
            {messages.historiqueVersion}
          </caption>
          <TableHeader>
            <TableRow>
              <TableCell className="w-24">{messages.colAction}</TableCell>
              <TableCell>{messages.colUtilisateur}</TableCell>
              <TableCell>{messages.colDate}</TableCell>
              <TableCell className="w-20">{messages.colAutomatique}</TableCell>
              <TableCell>{messages.colCommentaire}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {statutBadge(entry.de)} {'→'} {statutBadge(entry.vers)}
                </TableCell>
                <TableCell>{entry.userName}</TableCell>
                <TableCell>{new Date(entry.at).toLocaleString('fr-FR')}</TableCell>
                <TableCell>
                  {entry.automatique ? 'Oui' : 'Non'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.commentaire ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
