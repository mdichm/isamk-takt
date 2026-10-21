'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findChargeRuleSets,
  findChargeRuleSet,
  createChargeRuleSet,
  updateChargeRuleSet,
  deleteChargeRuleSet,
  publishChargeRuleSet,
  newChargeRuleSetVersion,
  type ChargeRuleSet,
  type CreateChargeRuleSetInput,
  type UpdateChargeRuleSetInput,
} from '@/lib/api/charge-ruleset';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

export type { ChargeRuleSet, CreateChargeRuleSetInput, UpdateChargeRuleSetInput };
export type { PeriodeRegle } from '@/lib/api/charge-ruleset';

// Clés de cache React Query
export const chargeRulesetKeys = {
  all: ['charge-rulesets'] as const,
  list: () => [...chargeRulesetKeys.all, 'list'] as const,
  detail: (id: string) => [...chargeRulesetKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste des jeux de règles de charge.
 */
export function useChargeRuleSets() {
  return useQuery({
    queryKey: chargeRulesetKeys.list(),
    queryFn: findChargeRuleSets,
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer un jeu de règles de charge par son ID.
 */
export function useChargeRuleSet(id: string) {
  return useQuery({
    queryKey: chargeRulesetKeys.detail(id),
    queryFn: () => findChargeRuleSet(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer un jeu de règles de charge.
 */
export function useCreateChargeRuleSet() {
  const queryClient = useQueryClient();
  return useMutation<ChargeRuleSet, Error, CreateChargeRuleSetInput>({
    mutationFn: createChargeRuleSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.list() });
      toast.success(messages.successRulesetCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateRuleset);
    },
  });
}

/**
 * Hook pour mettre à jour un jeu de règles de charge.
 */
export function useUpdateChargeRuleSet() {
  const queryClient = useQueryClient();
  return useMutation<
    ChargeRuleSet,
    Error,
    { id: string; input: UpdateChargeRuleSetInput }
  >({
    mutationFn: ({ id, input }) => updateChargeRuleSet(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.list() });
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.detail(id) });
      toast.success(messages.successRulesetUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateRuleset);
    },
  });
}

/**
 * Hook pour supprimer un jeu de règles de charge.
 */
export function useDeleteChargeRuleSet() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteChargeRuleSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.list() });
      toast.success(messages.successRulesetDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteRuleset);
    },
  });
}

/**
 * Hook pour publier un jeu de règles de charge.
 */
export function usePublishChargeRuleSet() {
  const queryClient = useQueryClient();
  return useMutation<ChargeRuleSet, Error, string>({
    mutationFn: publishChargeRuleSet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.list() });
      queryClient.invalidateQueries({
        queryKey: chargeRulesetKeys.detail(data.id),
      });
      toast.success(messages.successRulesetPublished);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorPublishRuleset);
    },
  });
}

/**
 * Hook pour créer une nouvelle version d’un jeu de règles publié.
 */
export function useNewChargeRuleSetVersion() {
  const queryClient = useQueryClient();
  return useMutation<ChargeRuleSet, Error, string>({
    mutationFn: newChargeRuleSetVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chargeRulesetKeys.list() });
      toast.success(messages.successRulesetCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateRuleset);
    },
  });
}