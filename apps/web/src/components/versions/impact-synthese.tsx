'use client';

import { useImpact } from '@/hooks/use-validation-departement';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { messages } from '@/lib/messages/fr';

interface ImpactSyntheseProps {
  versionId: string;
}

const raisonLabels: Record<string, string> = {
  PREMIERE_VERSION: messages.impactRaisonPremièreVersion,
  SEANCES_MODIFIEES: messages.impactRaisonSeancesModifiees,
  ENSEIGNANT_PARTAGE: messages.impactRaisonEnseignantPartage,
  SNAPSHOT_MODIFIE: messages.impactRaisonSnapshotModifie,
  AUCUN_CHANGEMENT: messages.impactRaisonAucunChangement,
};

function statutBadge(statut: 'IMPACTE' | 'NON_IMPACTE') {
  const isImpacte = statut === 'IMPACTE';
  return (
    <Badge
      variant={isImpacte ? 'destructive' : 'secondary'}
      className={isImpacte
        ? 'bg-red-100 text-red-900 border-red-200'
        : 'bg-blue-100 text-blue-900 border-blue-200'}
    >
      {isImpacte ? messages.impactStatutImpacte : messages.impactStatutNonImpacte}
    </Badge>
  );
}

export function ImpactSynthese({ versionId }: ImpactSyntheseProps) {
  const { data, isLoading, error } = useImpact(versionId);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <span className="text-muted-foreground">{messages.impactChargement}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">{messages.impactErreur}</p>
      </div>
    );
  }

  const departements = data?.departements ?? [];
  const resume = data?.resume;

  return (
    <div className="p-6 space-y-6">
      {/* Résumé en haut */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <h2 className="text-sm font-semibold mb-3">{messages.impactResume}</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-100 text-red-900">
              {resume?.impactes ?? 0}
            </Badge>
            <span className="text-muted-foreground">
              {messages.impactDepartementsImpactes}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-900">
              {resume?.nonImpactes ?? 0}
            </Badge>
            <span className="text-muted-foreground">
              {messages.impactDepartementsNonImpactes}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {resume?.reportees ?? 0}
            </Badge>
            <span className="text-muted-foreground">
              {messages.impactDepartementsReportees}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau par département */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>{messages.impactColDepartement}</TableCell>
            <TableCell>{messages.impactColStatut}</TableCell>
            <TableCell>{messages.impactColRaison}</TableCell>
            <TableCell className="w-32">{messages.impactColReportee}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departements.map((dept) => {
            const reasonLabel =
              raisonLabels[dept.raison] ?? dept.raison;
            return (
              <TableRow key={dept.departementId}>
                <TableCell className="font-medium">
                  {dept.departementCode} — {dept.departementLibelle}
                </TableCell>
                <TableCell>{statutBadge(dept.statut)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reasonLabel}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {dept.reportee ? messages.impactApprobationReportee : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
