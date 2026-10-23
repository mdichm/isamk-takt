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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useConflits,
  useSimulatePlacement,
  type Conflit,
} from '@/hooks/use-conflits';
import { AccepterDialog } from './accepter-dialog';
import {
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { messages } from '@/lib/messages/fr';

interface ConflitsListProps {
  versionId: string;
}

export function ConflitsList({ versionId }: ConflitsListProps) {
  const { data: conflits = [], isLoading } = useConflits(versionId);
  const simulateMutation = useSimulatePlacement('');

  const [filterType, setFilterType] = useState<string>('tous');
  const [filterSeverite, setFilterSeverite] = useState<string>('tous');
  const [openAccept, setOpenAccept] = useState(false);
  const [selected, setSelected] = useState<Conflit | null>(null);

  const types = Array.from(new Set(conflits.map((c) => c.type)));
  const severites = Array.from(new Set(conflits.map((c) => c.severite)));

  const filtered = conflits.filter((c) => {
    const matchType = filterType === 'tous' || c.type === filterType;
    const matchSeverite =
      filterSeverite === 'tous' || c.severite === filterSeverite;
    return matchType && matchSeverite;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <CardTitle>{messages.conflits}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {conflits.length} conflit{conflits.length > 1 ? 's' : ''} détecté{
            conflits.length > 1 ? 's' : ''
          }
        </p>
        <div className="flex items-center gap-4">
          <Select
            defaultValue="tous"
            onValueChange={(v) => setFilterType(v ?? 'tous')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{messages.filtreTousTypes}</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue="tous"
            onValueChange={(v) => setFilterSeverite(v ?? 'tous')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{messages.filtreToutesSeverites}</SelectItem>
              {severites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            {messages.loading}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
            <p>{messages.conflitsAucun || 'Aucun conflit détecté.'}</p>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {messages.conflitsActifs || 'Conflits actifs'}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.colonneRegle}</TableHead>
                  <TableHead>{messages.colonneType}</TableHead>
                  <TableHead>{messages.colonneSeverite}</TableHead>
                  <TableHead>{messages.colonneSeances}</TableHead>
                  <TableHead>{messages.colonneMessage}</TableHead>
                  <TableHead className="text-right">{messages.colonneAction}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.signature}>
                    <TableCell className="font-medium text-sm">
                      {c.regleCode}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <Badge variant="outline">{c.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <Badge
                        variant={
                          c.severite === 'BLOQUANT' ? 'destructive' : 'secondary'
                        }
                      >
                        {c.severite}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground break-all">
                      {c.seanceIds.length} séance{
                        c.seanceIds.length > 1 ? 's' : ''
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[240px]">
                      {c.message}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.severite === 'AVERTISSEMENT' ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelected(c);
                            setOpenAccept(true);
                          }}
                          disabled={simulateMutation.isPending}
                        >
                          {messages.avertissementBoutonAccepter}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            // Simulation à implémenter avec le sélecteur de séance
                          }}
                          disabled={simulateMutation.isPending}
                        >
                          {messages.btnSimuler}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <AccepterDialog
        open={openAccept}
        onOpenChange={(v) => setOpenAccept(v)}
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
          setOpenAccept(false);
        }}
      />
    </Card>
  );
}
