import { useCallback, useEffect, useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { SaveBatcher } from '@frontend/lib/save-batcher';

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

  // One request at a time, the taps made meanwhile batched into the next (see SaveBatcher)
  const batcher = useMemo(
    () =>
      new SaveBatcher(
        // keepalive: a reload or a closed tab right after a tap doesn't drop the save
        (changes) =>
          rpgWorldApi.put(`/api/characters/${id}`, { updates: changes }, { keepalive: true }),
        (err) => {
          toast.error(getErrorMessage(err));
          void queryClient.invalidateQueries({ queryKey: ['character', id] });
        },
      ),
    // getErrorMessage only changes with the language
    [id, queryClient, getErrorMessage],
  );

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      // A tap still saving would come back undone: fetch once the server has it
      await batcher.settled();
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
      // After the taps saving in the background: two saves together could undo each other
      await batcher.settled();
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

  // A page going away sends what is still waiting at once, instead of after the request in flight
  useEffect(() => {
    const flush = () => batcher.flush();
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [batcher]);

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
      return batcher.push(changes);
    },
    [queryClient, id, batcher],
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
