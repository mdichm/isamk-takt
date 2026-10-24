'use client';

// SPDX-License-Identifier: AGPL-3.0-only
// TAKT - Hook React Query pour les voeux (L3-34)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findAllVoeux,
  findVoeuById,
  createVoeu,
  updateVoeu,
  deleteVoeu,

  type VoeuResponseDto,
  type CreateVoeuDto,
  type UpdateVoeuDto,
  type VoeuQueryDto,
} from '@/lib/api/voeux';
import { getErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';
import { messages } from '@/lib/messages/fr';

// Clés de cache React Query
export const voeuxKeys = {
  all: ['voeux'] as const,
  list: (query: VoeuQueryDto) => [...voeuxKeys.all, 'list', query] as const,
  detail: (id: string) => [...voeuxKeys.all, 'detail', id] as const,
};

/**
 * Hook pour récupérer la liste paginée des vœux avec filtres.
 */
export function useVoeux(query?: VoeuQueryDto) {
  return useQuery({
    queryKey: voeuxKeys.list(query ?? {}),
    queryFn: () => findAllVoeux(query),
    staleTime: 30_000,
  });
}

/**
 * Hook pour récupérer un vœu par son ID.
 */
export function useVoeu(id: string) {
  return useQuery({
    queryKey: voeuxKeys.detail(id),
    queryFn: () => findVoeuById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Hook pour créer un vœu.
 */
export function useCreateVoeu() {
  const queryClient = useQueryClient();
  return useMutation<VoeuResponseDto, Error, CreateVoeuDto>({
    mutationFn: createVoeu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voeuxKeys.all });
      toast.success(messages.successVoeuCreated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorCreateVoeu);
    },
  });
}

/**
 * Hook pour mettre à jour un vœu.
 */
export function useUpdateVoeu() {
  const queryClient = useQueryClient();
  return useMutation<
    VoeuResponseDto,
    Error,
    { id: string; input: UpdateVoeuDto }
  >({
    mutationFn: ({ id, input }) => updateVoeu(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: voeuxKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: voeuxKeys.all });
      toast.success(messages.successVoeuUpdated);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorUpdateVoeu);
    },
  });
}

/**
 * Hook pour supprimer (désactiver) un vœu.
 */
export function useDeleteVoeu() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteVoeu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voeuxKeys.all });
      toast.success(messages.successVoeuDeleted);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || messages.errorDeleteVoeu);
    },
  });
}