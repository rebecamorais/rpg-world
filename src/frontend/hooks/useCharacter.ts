import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

/**
 * `initial` comes from the server render and counts as just fetched. `fetch: false` only reads
 * what another caller loads (the sheet loads it; the sidebar just shows it).
 */
export function useCharacter(
  id: string,
  { initial, fetch = true }: { initial?: DnD5eCharacter; fetch?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useErrorMessage();

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const data = await rpgWorldApi.get<DnD5eCharacter>(`/api/characters/${id}`);
      return data;
    },
    enabled: fetch && !!id,
    initialData: initial,
    // Same as the app default, stated here: the server's character must not refetch on mount
    staleTime: 60 * 1000,
  });

  const character = query.data;

  const updateMutation = useMutation({
    // Only `changes` go: the server applies them on top of what it has, so a save never undoes
    // what another device saved meanwhile. `character` (the whole draft) fills the cache.
    mutationFn: async ({
      character,
      changes,
    }: {
      character: DnD5eCharacter;
      changes: Partial<DnD5eCharacter>;
    }) => {
      await rpgWorldApi.put(`/api/characters/${character.id}`, { updates: changes });
    },
    onSuccess: (_data, { character }) => {
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
