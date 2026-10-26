'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVersionProvenance } from '@/hooks/use-version-provenance';
import { messages } from '@/lib/messages/fr';

interface VersionProvenanceProps {
  versionId: string;
}

function origineLabel(origine: 'GENERATION' | 'MANUELLE'): string {
  return origine === 'GENERATION'
    ? messages.provenanceOrigineGeneration
    : messages.provenanceOrigineManuelle;
}

function origineBadgeVariant(origine: 'GENERATION' | 'MANUELLE') {
  return origine === 'GENERATION' ? 'default' : 'secondary';
}

export function VersionProvenance({
  versionId,
}: VersionProvenanceProps) {
  const {
    data: provenance,
    isLoading: loading,
    error: error,
  } = useVersionProvenance(versionId);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">
          {messages.provenanceChargement}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.provenanceErreur}
        </p>
      </div>
    );
  }

  if (!provenance) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.provenanceIndisponible}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {messages.provenanceTitre}
          </h2>
          <p className="text-sm text-muted-foreground">
            {messages.provenanceVersion}: {provenance.versionNumero}
          </p>
        </div>
        <Badge variant={origineBadgeVariant(provenance.origine)}>
          {origineLabel(provenance.origine)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {messages.provenanceVersionNumero}: {provenance.versionNumero}
          </CardTitle>
          <CardDescription>
            {messages.provenanceStatut}: {provenance.statut}
          </CardDescription>
        </CardHeader>
      </Card>

      {provenance.origine === 'GENERATION' && provenance.generation ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.provenanceGeneration}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationStatut}
                </span>
                <span className="text-sm">
                  {provenance.generation.statut ?? '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationMode}
                </span>
                <span className="text-sm">
                  {provenance.generation.mode ?? '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationMoteur}
                </span>
                <span className="text-sm">
                  {provenance.generation.engine ?? '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationVersionMoteur}
                </span>
                <span className="text-sm">
                  {provenance.generation.engineVersion ?? '-'}
                </span>
              </div>
            </div>
            {provenance.generation.perimetreHash ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationPerimetre}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {provenance.generation.perimetreHash}
                </span>
              </div>
            ) : null}
            {provenance.generation.creeLe ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceGenerationCreeLe}
                </span>
                <span className="text-sm">
                  {new Date(provenance.generation.creeLe).toLocaleString()}
                </span>
              </div>
            ) : null}
            {provenance.generation.profil ? (
              <div className="pt-4 border-t">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {messages.provenanceProfil}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">
                      {messages.provenanceProfilCode}
                    </span>
                    <span className="text-sm font-mono">
                      {provenance.generation.profil.code ?? '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">
                      {messages.provenanceProfilNumero}
                    </span>
                    <span className="text-sm">
                      {provenance.generation.profil.numero ?? '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">
                      {messages.provenanceProfilLibelle}
                    </span>
                    <span className="text-sm">
                      {provenance.generation.profil.libelle ?? '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase">
                      {messages.provenanceProfilVersionMoteur}
                    </span>
                    <span className="text-sm">
                      {provenance.generation.profil.engineVersion ?? '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {provenance.snapshots && provenance.snapshots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.provenanceSnapshots}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.provenanceSnapshotId}</TableHead>
                  <TableHead>{messages.provenanceSnapshotRepartition}</TableHead>
                  <TableHead>{messages.provenanceSnapshotRevision}</TableHead>
                  <TableHead>{messages.provenanceSnapshotChargeRuleSet}</TableHead>
                  <TableHead>{messages.provenanceSnapshotValide}</TableHead>
                  <TableHead>{messages.provenanceSnapshotDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provenance.snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.repartitionId}
                    </TableCell>
                    <TableCell className="text-sm">{s.revision}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate">
                      {s.chargeRuleSet.code}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">
                        {s.parAdministrateur
                          ? messages.provenanceSnapshotAdminOui
                          : messages.provenanceSnapshotAdminNon}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.validatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {provenance.chargeRuleSets && provenance.chargeRuleSets.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.provenanceChargeRuleSets}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {provenance.chargeRuleSets.map((crs) => (
              <div key={crs.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="text-sm font-medium">{crs.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {crs.libelle}
                  </div>
                </div>
                {crs.version ? (
                  <span className="text-xs text-muted-foreground">
                    {messages.provenanceChargeRuleSetVersion}: {crs.version}
                  </span>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {provenance.adaptateur ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.provenanceAdaptateur}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase">
                {messages.provenanceAdaptateurNom}
              </span>
              <span className="text-sm font-mono">
                {provenance.adaptateur.nom}
              </span>
            </div>
            {provenance.adaptateur.version ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">
                  {messages.provenanceAdaptateurVersion}
                </span>
                <span className="text-sm">
                  {provenance.adaptateur.version}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {provenance.origine === 'MANUELLE' && provenance.seancesOrigine && provenance.seancesOrigine.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {messages.provenanceSeancesOrigine}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.provenanceSeanceCle}</TableHead>
                  <TableHead>{messages.provenanceSeanceJour}</TableHead>
                  <TableHead>{messages.provenanceSeanceCreneau}</TableHead>
                  <TableHead>{messages.provenanceSeanceSalle}</TableHead>
                  <TableHead>{messages.provenanceSeanceEnseignant}</TableHead>
                  <TableHead>{messages.provenanceSeanceStatut}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provenance.seancesOrigine.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">
                      {s.affectationKey}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.jour ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.creneauDebutId ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.salleId ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.enseignantId ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm">{s.statut}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <div className="flex justify-end text-xs text-muted-foreground">
        {messages.provenanceGenereLe}:
        {' '}
        {new Date(provenance.at).toLocaleString()}
      </div>
    </div>
  );
}
