'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAvertissements,
  useAccepterAvertissement,
  type AvertissementConflit,
} from '@/hooks/use-avertissements';
import { AccepterDialog } from './accepter-dialog';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { messages } from '@/lib/messages/fr';

interface AvertissementListProps {
  versionId: string;
}

export function AvertissementList({ versionId }: AvertissementListProps) {
  const { data: avertissements = [], isLoading } = useAvertissements(versionId);
  const acceptMutation = useAccepterAvertissement(versionId);

  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState<AvertissementConflit | null>(null);

  const nonAcceptees = avertissements.filter(
    (a) => a.severite === 'AVERTISSEMENT',
  );

  const handleAccepter = (a: AvertissementConflit) => {
    setSelected(a);
    setOpenDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {messages.avertissementTitre}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {messages.avertissementSousTitre}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            {messages.loading}
          </div>
        ) : nonAcceptees.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
            <p>{messages.avertissementAucun}</p>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {messages.avertissementNonAcceptees}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.colonneRegle}</TableHead>
                  <TableHead>{messages.colonneMessage}</TableHead>
                  <TableHead>{messages.colonneSeances}</TableHead>
                  <TableHead className="text-right">{messages.colonneAction}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonAcceptees.map((a) => (
                  <TableRow key={a.signature}>
                    <TableCell className="font-medium text-sm">
                      {a.regleCode}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {a.message}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground break-all">
                      {a.seanceIds.length} séance{ a.seanceIds.length > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAccepter(a)}
                        disabled={acceptMutation.isPending}
                      >
                        {messages.avertissementBoutonAccepter}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <CardContent className="border-t p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {messages.avertissementCaduciteNote}
        </div>
      </CardContent>

      <AccepterDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        versionId={versionId}
        avertissement={{
          signature: selected?.signature ?? '',
          regleCode: selected?.regleCode ?? '',
          message: selected?.message ?? '',
          seanceIds: selected?.seanceIds ?? [],
          details: selected?.details,
        }}
        onAccepted={() => {
          setSelected(null);
          setOpenDialog(false);
        }}
      />
    </Card>
  );
}
