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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { messages } from '@/lib/messages/fr';
import type { ChargeGlobaleDto } from '@/lib/api/charges';

function sourceBadge(source: string | undefined) {
  const variant =
    source === 'SNAPSHOT_VALIDE'
      ? 'default'
      : source === 'COPIE_TRAVAIL'
        ? 'secondary'
        : 'destructive';
  return (
    <Badge variant={variant} className="whitespace-nowrap">
      {source === 'SNAPSHOT_VALIDE'
        ? messages.sourceSnapshotValide
        : source === 'COPIE_TRAVAIL'
          ? messages.sourceCopieTravail
          : messages.sourceAbsent}
    </Badge>
  );
}

export function ChargeGlobaleTable({
  charge,
}: {
  charge: ChargeGlobaleDto;
}) {
  const [showDepartements, setShowDepartements] = useState(
    charge.parDepartement.length > 1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {messages.chargeGlobale}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{messages.columnMatricule}</Badge>
                <span className="font-medium">{charge.matricule}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{messages.columnNom}</Badge>
                <span className="font-medium">
                  {charge.prenom} {charge.nom}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{messages.labelDepartement}</Badge>
                <span>
                  {charge.parDepartement.map((d) => d.libelle).join(', ')}
                </span>
              </div>
              {charge.calculPartiel && (
                <div className="flex items-center gap-2 text-xs text-warning-foreground">
                  <Badge variant="outline">
                    {messages.labelCalculPartiel}
                  </Badge>
                  <span>{messages.labelCalculPartiel}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {charge.alerteDepassement && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 w-full md:w-64">
            <span className="font-bold">{messages.alerteDepassement}</span>{' '}
            {messages.depassePlafondGlobal}
          </div>
        )}


      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.chargeAnnuelle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeader>{messages.colonneSemestre}</TableHeader>
                  <TableHeader className="text-right">{messages.colonneS1}</TableHeader>
                  <TableHeader className="text-right">{messages.colonneS2}</TableHeader>
                  <TableHeader className="text-right">{messages.colonneTotal}</TableHeader>
                  <TableHeader className="text-right">{messages.labelServiceDu}</TableHeader>
                  <TableHeader className="text-right">{messages.labelEcart}</TableHeader>
                  <TableHeader className="text-right">{messages.labelHeuresSup}</TableHeader>
                  <TableHeader className="text-right">{messages.colonneSource}</TableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-medium bg-muted/50">
                  <TableCell>{messages.semestreS1}</TableCell>
                  <TableCell className="text-right">
                    {charge.parDepartement
                      .map((d) => d.volumeBrut)
                      .reduce((a, b) => a + b, 0)
                      .toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.parDepartement
                      .map((d) => d.chargeCalculee)
                      .reduce((a, b) => a + b, 0)
                      .toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalChargeCalculee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalServiceDu.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalEcart.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalHeuresSup.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{sourceBadge(charge.calculPartiel ? 'COPIE_TRAVAIL' : 'SNAPSHOT_VALIDE')}</TableCell>
                </TableRow>
                <TableRow className="font-medium">
                  <TableCell>{messages.semestreS2}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right">
                    {charge.totalChargeCalculee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalServiceDu.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalEcart.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalHeuresSup.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
                <TableRow className="font-medium border-t border-border">
                  <TableCell>{messages.totalAnnuel}</TableCell>
                  <TableCell className="text-right">
                    {charge.totalVolumeBrut.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalChargeCalculee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.totalChargeCalculee.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {charge.totalServiceDu.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {charge.totalEcart.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {charge.totalHeuresSup.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {charge.parDepartement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle
              onClick={() => setShowDepartements(!showDepartements)}
              className="cursor-pointer"
            >
              {messages.chargeParDepartement}
              {' '}
              <span className="text-xs">
                {showDepartements ? messages.moins : messages.plus}
              </span>
            </CardTitle>
          </CardHeader>
          {showDepartements && (
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeader>{messages.labelDepartement}</TableHeader>
                      <TableHeader className="text-right">{messages.labelVolumeBrut}</TableHeader>
                      <TableHeader className="text-right">{messages.labelChargeCalculee}</TableHeader>
                      <TableHeader className="text-right">{messages.labelServiceDu}</TableHeader>
                      <TableHeader className="text-right">{messages.labelEcart}</TableHeader>
                      <TableHeader className="text-right">{messages.labelHeuresSup}</TableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charge.parDepartement.map((d) => (
                      <TableRow key={d.departementId}>
                        <TableCell className="font-medium">{d.libelle}</TableCell>
                        <TableCell className="text-right">{d.volumeBrut.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{d.chargeCalculee.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{d.serviceDu.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{d.ecart.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{d.heuresSup.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}