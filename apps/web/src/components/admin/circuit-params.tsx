'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useUpdateWorkflowParams,
  useWorkflowParams,
} from '@/hooks/use-workflow-params';
import { getErrorMessage } from '@/lib/api/errors';
import { messages } from '@/lib/messages/fr';

/**
 * Paramétrage du circuit de validation et de publication (L5-19).
 *
 * Les deux interrupteurs sont globaux et activés par défaut. Ils sont copiés
 * sur la version à chaque soumission : un changement ultérieur ne touche pas
 * un cycle déjà ouvert (EX-WFL-02).
 */
export function CircuitParams() {
  const { data: params, isLoading } = useWorkflowParams();
  const updateParams = useUpdateWorkflowParams();

  // null tant que l'utilisateur n'a pas modifié les valeurs affichées.
  const [draft, setDraft] = useState<{
    validationPlanningRequise: boolean;
    publicationRequise: boolean;
  } | null>(null);
  const [motif, setMotif] = useState('');

  if (isLoading || !params) {
    return (
      <div className="p-4">
        <p>{messages.loading}</p>
      </div>
    );
  }

  const validationPlanningRequise =
    draft?.validationPlanningRequise ?? params.validationPlanningRequise;
  const publicationRequise =
    draft?.publicationRequise ?? params.publicationRequise;
  const modifie =
    validationPlanningRequise !== params.validationPlanningRequise ||
    publicationRequise !== params.publicationRequise;

  const onSubmit = async () => {
    try {
      await updateParams.mutateAsync({
        validationPlanningRequise,
        publicationRequise,
        ...(motif.trim() ? { motif: motif.trim() } : {}),
      });
      setDraft(null);
      setMotif('');
    } catch (error) {
      // Le message d'erreur est déjà affiché par le hook (toast).
      void getErrorMessage(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{messages.adminCircuit}</h1>
        <p className="text-muted-foreground">{messages.adminCircuitSubtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.circuitInterrupteurs}</CardTitle>
          <CardDescription>{messages.circuitInterrupteursDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="circuit-validation">
                {messages.circuitValidationRequise}
              </Label>
              <p className="text-sm text-muted-foreground">
                {messages.circuitValidationRequiseDescription}
              </p>
            </div>
            <Switch
              id="circuit-validation"
              checked={validationPlanningRequise}
              onCheckedChange={(checked: boolean) =>
                setDraft({
                  validationPlanningRequise: checked,
                  publicationRequise,
                })
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="circuit-publication">
                {messages.circuitPublicationRequise}
              </Label>
              <p className="text-sm text-muted-foreground">
                {messages.circuitPublicationRequiseDescription}
              </p>
            </div>
            <Switch
              id="circuit-publication"
              checked={publicationRequise}
              onCheckedChange={(checked: boolean) =>
                setDraft({
                  validationPlanningRequise,
                  publicationRequise: checked,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="circuit-motif">{messages.circuitMotif}</Label>
            <Input
              id="circuit-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={messages.circuitMotifPlaceholder}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={updateParams.isPending || !modifie}
          >
            {updateParams.isPending
              ? messages.circuitEnregistrementEnCours
              : messages.circuitEnregistrer}
          </Button>
          <p className="text-sm text-muted-foreground">
            {messages.circuitDerniereModification}{' '}
            {new Date(params.updatedAt).toLocaleString('fr-FR')}
            {params.updatedBy ? ` (${messages.circuitModifiePar} ${params.updatedBy})` : ''}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
