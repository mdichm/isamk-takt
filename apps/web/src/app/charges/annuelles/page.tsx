'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnnualCharges } from '@/hooks/use-charges';
import { messages } from '@/lib/messages/fr';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

const queryClient = new QueryClient();

export default function ChargesAnnuellesPage() {
  const [departementId, setDepartementId] = useState<string>('');

  const { data, isPending, error } = useAnnualCharges({
    departementId: departementId || undefined,
  });

  const charges = data?.data ?? [];

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{messages.chargesAnnueles}</h1>
        <p className="text-destructive">{messages.errorLoadCharges}</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="p-6 flex items-center justify-center">
        {messages.loading}
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{messages.chargesAnnueles}</h1>
          <p className="text-muted-foreground">
            {messages.chargeGlobaleSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">{messages.department}</label>
          <select
            value={departementId}
            onChange={(e) => setDepartementId(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">{messages.tous}</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader>{messages.columnMatricule}</TableHeader>
                <TableHeader>{messages.columnNom}</TableHeader>
                <TableHeader className="text-right">{messages.colonneS1}</TableHeader>
                <TableHeader className="text-right">{messages.colonneS2}</TableHeader>
                <TableHeader className="text-right">{messages.colonneTotal}</TableHeader>
                <TableHeader className="text-right">{messages.labelServiceDu}</TableHeader>
                <TableHeader className="text-right">{messages.labelEcart}</TableHeader>
                <TableHeader className="text-right">{messages.labelHeuresSup}</TableHeader>
                <TableHeader className="text-right">{messages.columnActions}</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    {messages.noCharges}
                  </TableCell>
                </TableRow>
              ) : (
                charges.map((c) => (
                  <TableRow key={c.enseignantId}>
                    <TableCell className="font-medium">{c.matricule}</TableCell>
                    <TableCell>{c.prenom} {c.nom}</TableCell>
                    <TableCell className="text-right">{c.s1.chargeCalculee.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{c.s2.chargeCalculee.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{c.total.chargeCalculee.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{c.total.serviceDu.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{c.total.ecart.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{c.total.heuresSup.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/enseignants/${c.enseignantId}/charge-globale`}>
                        <a className="text-primary hover:underline">{messages.btnVoir}</a>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>


      </div>
    </QueryClientProvider>
  );
}