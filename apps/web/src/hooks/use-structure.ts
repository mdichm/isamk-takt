 'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDepartement,
  findAllDepartements,
  deleteDepartement,
  updateDepartement,
  reorderDepartements,
  UpdateDepartementInput,
  createFormation,
  findAllFormations,
  deleteFormation,
  updateFormation,
  reorderFormations,
  UpdateFormationInput,
  createNiveau,
  findAllNiveaux,
  deleteNiveau,
  updateNiveau,
  reorderNiveaux,
  UpdateNiveauInput,
  createGroupe,
  findAllGroupes,
  deleteGroupe,
  updateGroupe,
  reorderGroupes,
  UpdateGroupeInput,
} from '@/lib/api/structure';
import {
  findAllAnnees,
  findAllSemestres,
  Annee,
  Semestre,
} from '@/lib/api/annees';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

const DEPARTEMENTS_KEY = ['departements'];

export function useDepartements(query?: {
  page?: number;
  limit?: number;
  search?: string;
  anneeId?: string;
}) {
  return useQuery({
    queryKey: [...DEPARTEMENTS_KEY, query],
    queryFn: () => findAllDepartements(query),
  });
}

export function useCreateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTEMENTS_KEY });
      toast.success(messages.successDepartementCreated);
    },
    onError: () => {
      toast.error(messages.errorCreateDepartement);
    },
  });
}

export function useUpdateDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDepartementInput }) =>
      updateDepartement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTEMENTS_KEY });
      toast.success(messages.successDepartementUpdated);
    },
    onError: () => {
      toast.error(messages.errorUpdateDepartement);
    },
  });
}

export function useDeleteDepartement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTEMENTS_KEY });
      toast.success(messages.successDepartementDeleted);
    },
    onError: () => {
      toast.error(messages.errorDeleteDepartement);
    },
  });
}

export function useReorderDepartements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderDepartements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTEMENTS_KEY });
      toast.success(messages.successReorder);
    },
    onError: () => {
      toast.error(messages.errorReorder);
    },
  });
}

const FORMATIONS_KEY = ['formations'];

export function useFormations(query?: {
  page?: number;
  limit?: number;
  search?: string;
  departementId?: string;
}) {
  return useQuery({
    queryKey: [...FORMATIONS_KEY, query],
    queryFn: () => findAllFormations(query),
  });
}

export function useCreateFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFormation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      toast.success(messages.successFormationCreated);
    },
    onError: () => {
      toast.error(messages.errorCreateFormation);
    },
  });
}

export function useUpdateFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFormationInput }) =>
      updateFormation(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      toast.success(messages.successFormationUpdated);
    },
    onError: () => {
      toast.error(messages.errorUpdateFormation);
    },
  });
}

export function useDeleteFormation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFormation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      toast.success(messages.successFormationDeleted);
    },
    onError: () => {
      toast.error(messages.errorDeleteFormation);
    },
  });
}

export function useReorderFormations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderFormations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      toast.success(messages.successReorder);
    },
    onError: () => {
      toast.error(messages.errorReorder);
    },
  });
}

const NIVEAUX_KEY = ['niveaux'];

export function useNiveaux(query?: {
  page?: number;
  limit?: number;
  search?: string;
  formationId?: string;
}) {
  return useQuery({
    queryKey: [...NIVEAUX_KEY, query],
    queryFn: () => findAllNiveaux(query),
  });
}

export function useCreateNiveau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNiveau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NIVEAUX_KEY });
      toast.success(messages.successNiveauCreated);
    },
    onError: () => {
      toast.error(messages.errorCreateNiveau);
    },
  });
}

export function useUpdateNiveau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNiveauInput }) =>
      updateNiveau(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NIVEAUX_KEY });
      toast.success(messages.successNiveauUpdated);
    },
    onError: () => {
      toast.error(messages.errorUpdateNiveau);
    },
  });
}

export function useDeleteNiveau() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNiveau,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NIVEAUX_KEY });
      toast.success(messages.successNiveauDeleted);
    },
    onError: () => {
      toast.error(messages.errorDeleteNiveau);
    },
  });
}

export function useReorderNiveaux() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderNiveaux,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NIVEAUX_KEY });
      toast.success(messages.successReorder);
    },
    onError: () => {
      toast.error(messages.errorReorder);
    },
  });
}

const GROUPES_KEY = ['groupes'];

export function useGroupes(query?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'SECTION' | 'GROUPE' | 'SOUS_GROUPE';
  niveauId?: string;
  semestreId?: string;
  parentId?: string;
}) {
  return useQuery({
    queryKey: [...GROUPES_KEY, query],
    queryFn: () => findAllGroupes(query),
  });
}

export function useCreateGroupe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGroupe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPES_KEY });
      toast.success(messages.successGroupeCreated);
    },
    onError: () => {
      toast.error(messages.errorCreateGroupe);
    },
  });
}

export function useUpdateGroupe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupeInput }) =>
      updateGroupe(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPES_KEY });
      toast.success(messages.successGroupeUpdated);
    },
    onError: () => {
      toast.error(messages.errorUpdateGroupe);
    },
  });
}

export function useDeleteGroupe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGroupe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPES_KEY });
      toast.success(messages.successGroupeDeleted);
    },
    onError: () => {
      toast.error(messages.errorDeleteGroupe);
    },
  });
}

export function useReorderGroupes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderGroupes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPES_KEY });
      toast.success(messages.successReorder);
    },
    onError: () => {
      toast.error(messages.errorReorder);
    },
  });
}

/* ============================================================================
   Années & Semestres
   ============================================================================ */

const ANNEE_KEY = ['annees'];

export function useAnnees(query?: {
  page?: number;
  limit?: number;
  search?: string;
  statut?: 'PREPARATION' | 'ACTIVE' | 'CLOTUREE';
}) {
  return useQuery<Annee[], Error>({
    queryKey: [...ANNEE_KEY, query],
    queryFn: () => findAllAnnees(query).then((res) => res.data),
  });
}

const SEMESTRE_KEY = ['semestres'];

export function useSemestres({ anneeId }: { anneeId?: string }) {
  return useQuery<Semestre[], Error>({
    queryKey: [...SEMESTRE_KEY, anneeId],
    queryFn: () => {
      if (!anneeId) {
        return Promise.resolve([]);
      }
      return findAllSemestres(anneeId).then((res) => res.data);
    },
    enabled: !!anneeId,
  });
}
