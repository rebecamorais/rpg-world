import { useCallback, useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

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
  const { apiPath } = useSheetSource(id);

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const data = await rpgWorldApi.get<DnD5eCharacter>(apiPath);
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

  // Quick saves go one at a time: the server rewrites the sheet's data on each save, so two in
  // flight together could undo each other
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  /**
   * Saves what changes during play (a tap on a hit die, a resource box, the HP) in the background.
   * The sheet shows `character` at once and nothing else on screen reacts: no "Saving…", no lock,
   * no refetch afterwards. Rejects when the save fails, after showing the error and reloading the
   * character from the server.
   */
  const saveQuietly = useCallback(
    ({ character, changes }: { character: DnD5eCharacter; changes: Partial<DnD5eCharacter> }) => {
      // A refetch still in flight would bring back the copy from before this change
      void queryClient.cancelQueries({ queryKey: ['character', id] });
      queryClient.setQueryData(['character', id], character);
      const send = queue.current
        .catch(() => {})
        .then(() => rpgWorldApi.put(`/api/characters/${character.id}`, { updates: changes }));
      queue.current = send;
      return send.then(
        () => undefined,
        (err: Error) => {
          toast.error(getErrorMessage(err));
          void queryClient.invalidateQueries({ queryKey: ['character', id] });
          throw err;
        },
      );
    },
    [queryClient, id, getErrorMessage],
  );

  return {
    character,
    isLoading: query.isLoading,
    error: query.error,
    updateCharacter: updateMutation.mutateAsync,
    saveQuietly,
    isSaving: updateMutation.isPending,
  };
}
