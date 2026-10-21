'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Play } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';
import {
  useChargeRuleSets,
  useDeleteChargeRuleSet,
  usePublishChargeRuleSet,
} from '@/hooks/use-charge-ruleset';
import { messages } from '@/lib/messages/fr';
import { ChargeRuleSet } from '@/lib/api/charge-ruleset';

const periodeLabels: Record<string, string> = {
  HEBDOMADAIRE: messages.periodeHebdomadaire,
  SEMESTRIELLE: messages.periodeSemestrielle,
  ANNUELLE: messages.periodeAnnuelle,
};

export function RulesetsTable() {
  const { data, error, isPending } = useChargeRuleSets();
  const deleteMutation = useDeleteChargeRuleSet();
  const publishMutation = usePublishChargeRuleSet();
  const { toast } = useToast();

  if (error) {
    toast({
      title: messages.error,
      description: getErrorMessage(error) || messages.errorLoadRulesets,
      variant: 'destructive',
    });
  }

  const rulesets = data ?? [];
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);

  const handleDelete = (r: ChargeRuleSet) => {
    setDeleteId(r.id);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null);
  };

  const handlePublish = (r: ChargeRuleSet) => {
    setPublishId(r.id);
  };

  const handleConfirmPublish = () => {
    if (!publishId) return;
    publishMutation.mutate(publishId);
    setPublishId(null);
  };

  if (isPending) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chargement des jeux de règles de charge…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{messages.rulesets}</h1>
          <p className="text-muted-foreground">{messages.rulesetsSubtitle}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader>{messages.labelNumero}</TableHeader>
              <TableHeader>{messages.labelPeriode}</TableHeader>
              <TableHeader className="text-right">{messages.labelSeuil}</TableHeader>
              <TableHeader className="text-right">{messages.labelPlafond}</TableHeader>
              <TableHeader className="text-right">{messages.labelArrondi}</TableHeader>
              <TableHeader>{messages.labelAnnee}</TableHeader>
              <TableHeader>{messages.labelPublie}</TableHeader>
              <TableHeader className="text-right">{messages.columnActions}</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rulesets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {messages.noRulesets}
                </TableCell>
              </TableRow>
            ) : (
              rulesets.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.numero}</TableCell>
                  <TableCell>
                    <Badge variant="default">{periodeLabels[r.periode]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.seuil ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.plafond ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {r.arrondi ?? '—'}
                  </TableCell>
                  <TableCell>{r.anneeId ?? '—'}</TableCell>
                  <TableCell>
                    {r.publieLe ? (
                      <Badge variant="secondary">{messages.etatPublie}</Badge>
                    ) : (
                      <Badge variant="outline">{messages.etatBrouillon}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!r.publieLe && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(r)}
                        disabled={publishMutation.isPending}
                      >
                        <Play size={14} className="mr-1" />
                        {messages.btnPublier}
                      </Button>
                    )}
                    {!r.publieLe && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(r)}
                        disabled={deleteMutation.isPending || publishId !== null}
                        className="ml-2"
                      >
                        <Trash2 size={14} className="mr-1" />
                        {messages.btnSupprimer}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.btnSupprimer}</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce jeu de règles de charge ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              {messages.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              variant="destructive"
            >
              {deleteMutation.isPending
                ? messages.loading
                : messages.btnSupprimer}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!publishId}
        onOpenChange={(open) => {
          if (!open) setPublishId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.btnPublier}</DialogTitle>
            <DialogDescription>
              La publication rend ce jeu de règles immuable. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublishId(null)}
              disabled={publishMutation.isPending}
            >
              {messages.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPublish}
              disabled={publishMutation.isPending}
              variant="default"
            >
              {publishMutation.isPending ? messages.loading : messages.btnPublier}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
