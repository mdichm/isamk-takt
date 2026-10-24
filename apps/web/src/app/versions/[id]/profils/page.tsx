'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useProfils } from '@/hooks/use-profils';
import {
  ProfilsTable,
  ProfilFormDialog,
} from '@/components/profils';
import { messages } from '@/lib/messages/fr';
import { findVersionById, type Version } from '@/lib/api/versions';

export default function ProfilsPage() {
  const params = useParams();
  const versionId = params?.id as string | undefined;

  const [version, setVersion] = useState<Version | null>(null);
  const [versionLoading, setVersionLoading] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [openForm, setOpenForm] = useState(false);

  // Charger la version pour récupérer le semestreId
  useEffect(() => {
    let cancelled = false;
    const loadVersion = async () => {
      if (!versionId) {
        setVersionLoading(false);
        return;
      }
      setVersionLoading(true);
      try {
        const v = await findVersionById(versionId);
        if (!cancelled) {
          setVersion(v);
          setVersionLoading(false);
        }
      } catch {
        if (!cancelled) {
          setVersionError('Impossible de charger la version.');
          setVersionLoading(false);
        }
      }
    };
    loadVersion();
    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const semestreId = version?.semestreId;

  const { isPending: profilsPending, error: profilsError } =
    useProfils(semestreId ?? '');

  if (versionError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">{versionError}</p>
      </div>
    );
  }

  if (versionLoading || !semestreId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{messages.profils}</h1>
        <p className="text-muted-foreground">{messages.loading}</p>
      </div>
    );
  }

  if (profilsError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">{messages.errorLoadProfils}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{messages.profils}</h1>
          <p className="text-muted-foreground">{messages.profilsSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setOpenForm(true);
            }}
            disabled={profilsPending}
          >
            {messages.creerProfil}
          </Button>
        </div>
      </div>

      <ProfilsTable
        semestreId={semestreId!}
        onRefresh={() => {}}
      />

      {/* Dialog: Créer / Modifier un profil */}
      <ProfilFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        semestreId={semestreId!}
        onSuccess={() => {}}
      />
    </div>
  );
}