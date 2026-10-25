'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useUserDepartment,
  useImpact,
  useSubmitValidation,
} from '@/hooks/use-validation-departement';
import { messages } from '@/lib/messages/fr';

const rejectFormSchema = z.object({
  motif: z.string().min(1, { message: messages.motifRequis }),
});

type RejectFormData = z.infer<typeof rejectFormSchema>;

interface ValidationDepartementProps {
  versionId: string;
  versionNumero?: string;
}

export function ValidationDepartement({
  versionId,
}: ValidationDepartementProps) {
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: userDept, isLoading: loadingUser, error: userError } =
    useUserDepartment();
  const { data: impact, isLoading: loadingImpact, error: impactError } =
    useImpact(versionId);
  const submitValidation = useSubmitValidation(versionId);

  const form = useForm<RejectFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(rejectFormSchema) as any,
    defaultValues: { motif: '' },
  });

  if (loadingUser || loadingImpact) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">{messages.loading}</div>
      </div>
    );
  }

  if (userError || impactError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {getErrorMessage(userError ?? impactError)}
        </p>
      </div>
    );
  }

  const userDepartments = userDept?.departments ?? [];
  const userRole = userDept?.role;

  const isResponsable = userRole === 'RESPONSABLE_DEPARTEMENT';
  const isAdministrateur = userRole === 'ADMINISTRATEUR';

  if (!isResponsable && !isAdministrateur) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.validationDepartement}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.validationInterdite}
        </p>
      </div>
    );
  }

  const responsableDepartmentId = userDepartments[0];
  const impactDepartement = impact?.departements.find(
    (d) => d.departementId === responsableDepartmentId,
  );

  if (!responsableDepartmentId && isResponsable) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">{messages.error}</h1>
        <p className="mt-2 text-muted-foreground">
          {messages.erreurChargementDepartement}
        </p>
      </div>
    );
  }

  const departementLibelle =
    impactDepartement?.departementLibelle ||
    responsableDepartmentId ||
    messages.department;
  const isNonImpacte =
    impactDepartement?.statut === 'NON_IMPACTE';
  const isReportee = impactDepartement?.reportee === true;
  const canDecide = !isNonImpacte && !isReportee;

  const onApprove = async () => {
    await submitValidation.mutateAsync({
      departementId: responsableDepartmentId!,
      decision: 'APPROUVE',
    });
  };

  const onReject: SubmitHandler<RejectFormData> = async (data) => {
    await submitValidation.mutateAsync({
      departementId: responsableDepartmentId!,
      decision: 'REJETE',
      motif: data.motif,
    });
    setRejectOpen(false);
    form.reset();
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">
        {messages.validationDepartementTitre.replace(
          '{departement}',
          departementLibelle,
        )}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {messages.validationDepartementSousTitre}
      </p>

      <div className="rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{messages.department}:</span>
          <span className="font-semibold">{departementLibelle}</span>
        </div>
        {isReportee ? (
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 rounded p-3">
            <span>{messages.approbationReportee}</span>
          </div>
        ) : isNonImpacte ? (
          <div className="flex items-center gap-2 text-blue-800 bg-blue-50 rounded p-3">
            <span>{messages.departementNonImpacte}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {messages.departementImpacte}
            </span>
          </div>
        )}
      </div>

      {canDecide && isResponsable ? (
        <div className="flex gap-3 mb-6">
          <Button
            onClick={onApprove}
            disabled={submitValidation.isPending}
            className="bg-green-100 hover:bg-green-200 text-green-900"
          >
            {submitValidation.isPending
              ? messages.btnApprobationEnCours
              : messages.btnApprouver}
          </Button>
          <Button
            onClick={() => setRejectOpen(true)}
            disabled={submitValidation.isPending}
            variant="destructive"
          >
            {messages.btnRejeter}
          </Button>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground mb-6">
          {isNonImpacte || isReportee
            ? messages.approbationReportee
            : 'Décision déjà prise pour ce département.'}
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messages.btnRejeter}</DialogTitle>
            <DialogDescription>
              {messages.validationDepartementSousTitre}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onReject)}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <Label>{messages.validationLabelMotif}</Label>
              <Textarea
                {...form.register('motif')}
                placeholder={messages.validationMotifPlaceholder}
                className="min-h-[100px]"
              />
              {form.formState.errors.motif && (
                <span className="text-sm text-destructive">
                  {form.formState.errors.motif.message}
                </span>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(false)}
                disabled={submitValidation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitValidation.isPending}>
                {submitValidation.isPending
                  ? messages.btnApprobationEnCours
                  : messages.btnRejeter}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}