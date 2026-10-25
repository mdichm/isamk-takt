'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePrevisualisationPublication,
  usePublishVersion,
} from '@/hooks/use-previsualisation-publication';
import { messages } from '@/lib/messages/fr';

interface PrevisualisationPublicationProps {
  versionId: string;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

function SeverityBadge({ severite }: { severite: string }) {
  const variant: BadgeVariant =
    severite === 'BLOQUANT'
      ? 'destructive'
      : severite === 'AVERTISSEMENT'
        ? 'secondary'
        : 'outline';
  return (
    <Badge variant={variant}>
      {severite === 'BLOQUANT'
        ? messages.previsualisationConflitBloquant
        : severite === 'AVERTISSEMENT'
          ? messages.previsualisationConflitAvertissement
          : messages.previsualisationConflitInfo}
    </Badge>
  );
}

export function PrevisualisationPublication({
  versionId,
}: PrevisualisationPublicationProps) {
  const [publishOpen, setPublishOpen] = useState(false);

  const {
    data: previs,
    isLoading: loading,
    error: error,
  } = usePrevisualisationPublication(versionId);

  const publishMutation = usePublishVersion(versionId);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">
          {messages.previsualisationChargement}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.previsualisationErreur}
        </p>
      </div>
    );
  }

  if (!previs) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          Données de prévisualisation indisponibles.
        </p>
      </div>
    );
  }

  const peutPublier =
    previs.statut === 'VALIDE' &&
    previs.departementsValides.length > 0 &&
    previs.conflits.every((c) => c.severite !== 'BLOQUANT' || c.resoluLe != null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationVersionCandidate}
          </CardTitle>
          <CardDescription>
            {previs.versionNumero} — {previs.statut} (révision {previs.revision})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previs.versionPrecedenteId ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  {messages.previsualisationVersionPrecedente}
                </span>
                <p className="font-medium">
                  {previs.versionPrecedenteNumero}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <div className="text-right">
                <span className="text-xs font-medium text-muted-foreground">
                  Publiée
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  {messages.previsualisationVersionPrecedente}
                </span>
                <p className="text-muted-foreground font-medium">
                  {messages.previsualisationAucunePrecedente}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationDepartementsValides}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previs.departementsValides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun département n a encore validé cette version.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.impactColDepartement}</TableHead>
                  <TableHead className="text-center">Décision</TableHead>
                  <TableHead className="text-right">Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previs.departementsValides.map((d) => (
                  <TableRow key={d.departementId}>
                    <TableCell>
                      {d.departementCode} — {d.departementLibelle}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {messages.previsualisationDepartementValide}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {d.userId ?? messages.impactColReportee}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationActivitesModifiees}
          </CardTitle>
          <CardDescription>
            {previs.activitesModifiees} activité(s) dans cette version
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previs.activites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune activité planifiée.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affectation</TableHead>
                  <TableHead>Enseignant</TableHead>
                  <TableHead className="text-center">Salle</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previs.activites.map((a) => (
                  <TableRow key={a.affectationKey}>
                    <TableCell className="text-sm">{a.affectationKey}</TableCell>
                    <TableCell className="text-sm">
                      {a.enseignantNom || a.enseignantId || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {a.salleCode || (
                        <span className="text-muted-foreground">
                          {messages.previsualisationActiviteNonPlanifiee}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      <Badge
                        variant={a.planifiee ? 'default' : 'outline'}
                      >
                        {a.planifiee
                          ? messages.previsualisationActivitePlanifiee
                          : messages.previsualisationActiviteNonPlanifiee}
                  </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationConflits}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previs.conflits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun conflit détecté.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Sévérité</TableHead>
                  <TableHead className="text-center">État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previs.conflits.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.type}</TableCell>
                    <TableCell className="text-center text-sm">
                      <SeverityBadge severite={c.severite} />
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {c.resoluLe != null ? (
                        <Badge variant="default">
                          {messages.previsualisationConflitResolu}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {messages.previsualisationConflitNonResolu}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationAvertissements}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previs.avertissementsAcceptes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun avertissement accepté.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Règle</TableHead>
                  <TableHead className="text-center">Accepté par</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previs.avertissementsAcceptes.map((a) => (
                  <TableRow key={a.regleCode}>
                    <TableCell className="text-sm">{a.regleCode}</TableCell>
                    <TableCell className="text-sm text-center">
                      {a.auteurId}
                    </TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">
                      {new Date(a.accepteLe).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationVerrous}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previs.verrous.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun verrou de séance actif.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Séance</TableHead>
                  <TableHead className="text-center">Auteur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previs.verrous.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.type}</TableCell>
                    <TableCell className="text-sm text-center">
                      {v.seanceId}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {v.auteurId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {messages.previsualisationProvenance}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {messages.previsualisationProvenanceGeneration}
            </span>
            <span>{previs.provenance.generationId ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {messages.previsualisationProvenanceProfil}
            </span>
            <span>
              {previs.provenance.profilNom ??
                `${messages.previsualisationProvenanceProfil} #${
                  previs.provenance.profilVersion ?? '—'
                }`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {messages.previsualisationProvenancePerimetre}
            </span>
            <span className="text-muted-foreground truncate max-w-xs">
              {previs.provenance.perimetreHash ?? '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {messages.previsualisationProvenanceMoteur}
            </span>
            <span>{previs.provenance.engineVersion ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {peutPublier
            ? 'La version est en état VALIDE et prête à être publiée.'
            : 'La version ne remplit pas toutes les conditions de publication.'}
        </div>
        <Button
          onClick={() => setPublishOpen(true)}
          disabled={!peutPublier || publishMutation.isPending}
          variant="destructive"
        >
          {publishMutation.isPending
            ? 'Publication en cours…'
            : messages.previsualisationBtnPublier}
        </Button>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.previsualisationBtnPublier}</DialogTitle>
            <DialogDescription>
              {messages.previsualisationConfirmation}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setPublishOpen(false)}
              disabled={publishMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                publishMutation.mutate();
                setPublishOpen(false);
              }}
              disabled={publishMutation.isPending || !peutPublier}
              variant="destructive"
            >
              {messages.previsualisationConfirmationPublier}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
