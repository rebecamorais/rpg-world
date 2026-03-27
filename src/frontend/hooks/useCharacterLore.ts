import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

export interface LoreData {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  backstory?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  alliesAndEnemies?: string;
  organizations?: string;
  treasure?: string;
}

export function useCharacterLore(characterId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['character-lore', characterId],
    queryFn: async () => {
      const data = await rpgWorldApi.get<LoreData>(`/api/characters/${characterId}/lore`);
      return data;
    },
    enabled: !!characterId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: LoreData) => {
      await rpgWorldApi.put(`/api/characters/${characterId}/lore`, updates);
    },
    onSuccess: (_data, updates) => {
      // Optimistically update the cache with the data we just saved
      queryClient.setQueryData(['character-lore', characterId], updates);
      queryClient.invalidateQueries({ queryKey: ['character-lore', characterId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    lore: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateLore: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
