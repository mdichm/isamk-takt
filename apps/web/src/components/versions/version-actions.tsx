'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExecuteTransition } from '@/hooks/use-version-transition';
import { useWorkflowParams } from '@/hooks/use-workflow-params';
import { newRevision, publishVersion } from '@/lib/api/versions';
import { getErrorMessage } from '@/lib/api/errors';
import type { TransitionType } from '@takt/contracts';
import { messages } from '@/lib/messages/fr';
import { toast } from 'sonner';

type Role =
  | 'ADMINISTRATEUR'
  | 'GESTIONNAIRE'
  | 'RESPONSABLE_DEPARTEMENT'
  | 'DIRECTION'
  | 'ENSEIGNANT'
  | 'ETUDIANT';

type Action =
  | 'DEMARRER_EDITION'
  | 'MARQUER_PRET'
  | 'SOUMETTRE'
  | 'REPRENDRE'
  | 'RESOUMETTRE'
  | 'ABANDONNER'
  | 'PUBLIER'
  | 'NOUVELLE_REVISION';

interface VersionActionsProps {
  version: { id: string; numero: string; statut: string };
  role?: Role;
  avertissementsNonAcceptes?: number;
}

/**
 * Matrice des actions autorisées par rôle et par état de version.
 * Alignée sur les permissions backend (policy.service.ts) et la table
 * de transitions (version.service.ts, ST §4.1.1).
 * DIRECTION, ENSEIGNANT, ETUDIANT et RESPONSABLE_DEPARTEMENT n'ont
 * aucune action de transition (lecture seule ou validation via /validation).
 */
const ACTIONS_PAR_ROLE_ET_STATUT: Record<
  Role,
  Record<string, Action[]>
> = {
  ADMINISTRATEUR: {
    BROUILLON: ['DEMARRER_EDITION'],
    EDITION: ['MARQUER_PRET', 'ABANDONNER'],
    PRET_POUR_VALIDATION: ['SOUMETTRE', 'REPRENDRE'],
    EN_VALIDATION: ['ABANDONNER'],
    VALIDE: ['PUBLIER', 'ABANDONNER'],
    PUBLIE: ['NOUVELLE_REVISION'],
    CORRECTION: ['REPRENDRE', 'RESOUMETTRE', 'ABANDONNER'],
    REJETE: ['REPRENDRE', 'ABANDONNER'],
    ARCHIVE: [],
  },
  GESTIONNAIRE: {
    BROUILLON: ['DEMARRER_EDITION'],
    EDITION: ['MARQUER_PRET', 'ABANDONNER'],
    PRET_POUR_VALIDATION: ['SOUMETTRE', 'REPRENDRE'],
    EN_VALIDATION: ['ABANDONNER'],
    VALIDE: ['PUBLIER', 'ABANDONNER'],
    PUBLIE: ['NOUVELLE_REVISION'],
    CORRECTION: ['REPRENDRE', 'RESOUMETTRE', 'ABANDONNER'],
    REJETE: ['REPRENDRE', 'ABANDONNER'],
    ARCHIVE: [],
  },
  RESPONSABLE_DEPARTEMENT: {},
  DIRECTION: {},
  ENSEIGNANT: {},
  ETUDIANT: {},
};

const ACTION_LABELS: Record<Action, string> = {
  DEMARRER_EDITION: messages.btnDemarrerEdition,
  MARQUER_PRET: messages.btnMarquerPret,
  SOUMETTRE: messages.btnSoumettre,
  REPRENDRE: messages.btnReprendre,
  RESOUMETTRE: messages.btnResoumettre,
  ABANDONNER: messages.btnAbandonner,
  PUBLIER: messages.btnPublierVersion,
  NOUVELLE_REVISION: messages.btnNouvelleRevision,
};

const ACTION_VARIANTS: Record<Action, string> = {
  DEMARRER_EDITION: '',
  MARQUER_PRET: '',
  SOUMETTRE: '',
  REPRENDRE: '',
  RESOUMETTRE: '',
  ABANDONNER: 'outline',
  PUBLIER: '',
  NOUVELLE_REVISION: 'outline',
};

/** Actions qui nécessitent une confirmation avant exécution. */
const ACTIONS_A_CONFIRMER = new Set<Action>(['SOUMETTRE', 'RESOUMETTRE']);

/** Actions qui appellent un endpoint dédié (pas une transition). */
const ACTIONS_DEDIEES = new Set<Action>(['PUBLIER', 'NOUVELLE_REVISION']);

export function VersionActions({
  version,
  role,
  avertissementsNonAcceptes,
}: VersionActionsProps) {
  const router = useRouter();
  const { mutate: executeTransition, isPending: transitionPending } =
    useExecuteTransition(version.id);
  // L5-19 : circuit global courant. Si la publication n'est pas requise, la
  // soumission publiera la version et archivera la version publiée actuelle :
  // une confirmation est alors exigée (EX-WFL-02).
  const { data: workflowParams } = useWorkflowParams();
  const publicationAutomatique = workflowParams?.publicationRequise === false;
  const [publishPending, setPublishPending] = useState(false);
  const [newRevisionPending, setNewRevisionPending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);

  const statut = version.statut;
  const allowedActions =
    role && ACTIONS_PAR_ROLE_ET_STATUT[role]
      ? ACTIONS_PAR_ROLE_ET_STATUT[role][statut] ?? []
      : [];

  const hasAvertissements =
    avertissementsNonAcceptes !== undefined
      ? avertissementsNonAcceptes > 0
      : true; // inconnu => on confirme par précaution

  const handleDediee = async (action: Action) => {
    try {
      if (action === 'PUBLIER') {
        setPublishPending(true);
        await publishVersion(version.id);
      } else if (action === 'NOUVELLE_REVISION') {
        setNewRevisionPending(true);
        await newRevision(version.id);
      }
      toast.success(messages.versionTransitionSucces);
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error) || messages.versionTransitionErreur);
    } finally {
      setPublishPending(false);
      setNewRevisionPending(false);
    }
  };

  const handleAction = (action: Action) => {
    if (ACTIONS_DEDIEES.has(action)) {
      void handleDediee(action);
      return;
    }
    // L5-19 : la confirmation est exigée si des avertissements ne sont pas
    // acceptés (L5-15) ou si la soumission publiera la version (EX-WFL-02).
    if (
      ACTIONS_A_CONFIRMER.has(action) &&
      (hasAvertissements || publicationAutomatique)
    ) {
      setConfirmAction(action);
      return;
    }
    executeTransition({ action: action as TransitionType });
  };

  const handleConfirm = () => {
    if (confirmAction) {
      executeTransition({
        action: confirmAction as TransitionType,
        confirmerPublication:
          confirmAction === 'SOUMETTRE' || confirmAction === 'RESOUMETTRE',
      });
      setConfirmAction(null);
    }
  };

  if (allowedActions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allowedActions.map((action) => {
        const isPending =
          transitionPending ||
          (action === 'PUBLIER' && publishPending) ||
          (action === 'NOUVELLE_REVISION' && newRevisionPending);
        const isConfirming = confirmAction === action;
        return (
          <Button
            key={action}
            onClick={() => handleAction(action)}
            disabled={isPending || isConfirming}
            variant={
              ACTION_VARIANTS[action] as
                | 'default'
                | 'secondary'
                | 'destructive'
                | 'outline'
                | 'ghost'
                | 'link'
                | undefined
            }
            className={`flex items-center gap-2 ${
              action === 'SOUMETTRE' || action === 'RESOUMETTRE'
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                : ''
            }`}
          >
            {isConfirming ? messages.confirmationSoumissionBoutonConfirmer : ACTION_LABELS[action]}
          </Button>
        );
      })}

      {/* Modale de confirmation globale à la soumission (avertissements non acceptés) */}
      {confirmAction !== null && (
        <Dialog
          open={confirmAction !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {publicationAutomatique
                  ? messages.confirmationSoumissionPublicationTitre
                  : messages.confirmationSoumissionTitre}
              </DialogTitle>
              <DialogDescription>
                {[
                  hasAvertissements
                    ? messages.confirmationSoumissionAvertissements
                    : null,
                  publicationAutomatique
                    ? messages.confirmationSoumissionPublication
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setConfirmAction(null)}
                variant="outline"
              >
                {messages.confirmationSoumissionBoutonAnnuler}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={transitionPending}
              >
                {messages.confirmationSoumissionBoutonConfirmer}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
