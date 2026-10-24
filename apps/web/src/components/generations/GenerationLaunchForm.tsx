'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { messages } from '@/lib/messages/fr';
import { t } from '@/lib/i18n';
import {
  launchGeneration,
  type GenerationResponse,
  type CreateGenerationInput,
  type PerimetreResponse,
  type FetMappingReport,
} from '@/lib/api/generations';
import { useProfils } from '@/hooks/use-profils';
import { getErrorMessage } from '@/lib/api/errors';

interface GenerationLaunchFormProps {
  versionId: string;
  perimetre: PerimetreResponse;
  fetMapping: FetMappingReport | null;
  onGenerationLaunched: (generation: GenerationResponse) => void;
}

export function GenerationLaunchForm({
  versionId,
  perimetre,
  fetMapping,
  onGenerationLaunched,
}: GenerationLaunchFormProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const { toast } = useToast();
  const { data: profils, isPending: profilsPending } = useProfils(
    perimetre.semestreId,
  );

  const nonTraduites = fetMapping?.stats.NON_TRADUITE ?? 0;
  const doitAcquitter = nonTraduites > 0;
  const [acknowledge, setAcknowledge] = useState(false);
  const [selectedProfilId, setSelectedProfilId] = useState('');

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const input: CreateGenerationInput = {
        profilId: selectedProfilId,
        perimetreHash: perimetre.perimetreHash,
        acknowledgeUntranslatedConstraints:
          doitAcquitter && acknowledge,
      };
      const generation = await launchGeneration(versionId, input);
      onGenerationLaunched(generation);
    } catch (error) {
      toast({
        variant: 'destructive',
        description: getErrorMessage(error),
      });
    } finally {
      setIsLaunching(false);
    }
  };

  if (!profils || profils.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('lancerGeneration')}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{messages.profilsVide}</p>
        </CardContent>
      </Card>
    );
  }

  const defaultProfil = profils.find((p) => p.estParDefaut);
  if (defaultProfil && !selectedProfilId) {
    setSelectedProfilId(defaultProfil.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('lancerGeneration')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border p-4 bg-muted/50">
            <h3 className="text-sm font-medium mb-2">
              {messages.perimetreFige}
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Généré le:{' '}
                {new Date(perimetre.genereLe).toLocaleDateString('fr-FR')}
              </p>
              <p>
                Départements: {perimetre.departements.length}, Activités:{' '}
                {perimetre.activites.length}, Groupes: {perimetre.groupes.length}
              </p>
              <p>
                Enseignants: {perimetre.enseignants.length}, Salles:{' '}
                {perimetre.salles.length}
              </p>
              <p>
                Contraintes: {perimetre.contraintes.length}, Verrous:{' '}
                {perimetre.verrous.length}
              </p>
            </div>
          </div>

          {fetMapping && doitAcquitter && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
              <h3 className="text-sm font-medium text-destructive mb-2">
                {messages.rapportTraduction}
              </h3>
              <p className="text-sm text-destructive mb-2">
                {nonTraduites} contrainte(s) non traduite(s) par l&apos;adaptateur
                FET. Vous devez les acquitter avant de lancer la génération.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {messages.profilGeneration}
            </label>
            <select
              value={selectedProfilId}
              onChange={(e) => setSelectedProfilId(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:pointer-events-none"
            >
              <option value="">{messages.colStatut}</option>
              {profils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} (v{p.numero})
                  {p.estParDefaut && ' — ' + messages.estParDefaut}
                </option>
              ))}
            </select>
          </div>

          {doitAcquitter && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acknowledge}
                onChange={(e) => setAcknowledge(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label className="text-sm leading-relaxed">
                {messages.acquitterContraintes}
              </label>
            </div>
          )}

          <Button
            onClick={handleLaunch}
            disabled={
              isLaunching ||
              profilsPending ||
              !selectedProfilId ||
              (doitAcquitter && !acknowledge)
            }
            className="w-full"
          >
            {isLaunching ? 'Lancement en cours…' : t('lancerGeneration')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}