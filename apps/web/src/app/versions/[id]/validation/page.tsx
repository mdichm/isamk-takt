'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationDepartement } from '@/components/versions/validation-departement';
import { messages } from '@/lib/messages/fr';

export default function ValidationPage() {
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
    <div className="p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-1">
            {messages.validationDepartement}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {messages.validationDepartementSousTitre}
          </p>
        </CardHeader>
        <CardContent>
          <ValidationDepartement versionId={id} />
        </CardContent>
      </Card>
    </div>
  );
}