import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

export function useCharacter(id: string) {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useErrorMessage();

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const data = await rpgWorldApi.get<DnD5eCharacter>(`/api/characters/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const character = query.data;

  const updateMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      await rpgWorldApi.put(`/api/characters/${character.id}`, {
        updates: character,
      });
    },
    onSuccess: (_data, character) => {
      // Optimistically update the cache with the data we just saved
      queryClient.setQueryData(['character', id], character);
      queryClient.invalidateQueries({ queryKey: ['character', id] });
    },
    onError: (err: Error) => {
      toast.error(getErrorMessage(err));
    },
  });

  return {
    character,
    isLoading: query.isLoading,
    error: query.error,
    updateCharacter: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
