import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { type APIError, rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import {
  QuietSaver,
  type Revisioned,
  type SaveResult,
  applyChanges,
} from '@frontend/lib/quiet-save';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

/** One toast for every failed background save: a burst of failed taps shows one error, not ten. */
const QUIET_ERROR_TOAST = 'character-quiet-save-error';

/** The 409 of a save that started from an older revision. By shape: tests mock the API client. */
export function isConflict(err: unknown): boolean {
  const { status, data } = (err ?? {}) as Partial<APIError>;
  return status === 409 && (data as { code?: unknown } | undefined)?.code === 'conflict';
}

/**
 * `initial` comes from the server render and counts as just fetched. `fetch: false` only reads
 * what another caller loads (the sheet loads it; the sidebar just shows it).
 * The sheet carries a `revision`: the Save button sends the one it started from, and a 409
 * (another device saved in between) sets `conflict` until `reload`.
 */
export function useCharacter(
  id: string,
  { initial, fetch = true }: { initial?: DnD5eCharacter; fetch?: boolean } = {},
) {
  const queryClient = useQueryClient();
  const t = useTranslations('common');
  const { getErrorMessage } = useErrorMessage();
  const { apiPath } = useSheetSource(id);
  const queryKey = useMemo(() => ['character', id], [id]);
  // Another device saved since this sheet loaded: the draft waits until the person reloads
  const [conflict, setConflict] = useState(false);

  // One request at a time, the taps made meanwhile batched into the next (see QuietSaver)
  const saver = useMemo(() => {
    const quiet: QuietSaver = new QuietSaver({
      // keepalive: a reload or a closed tab right after a tap doesn't drop the save
      send: (changes) =>
        rpgWorldApi.put<SaveResult>(
          `/api/characters/${id}`,
          { updates: changes },
          { keepalive: true },
        ),
      read: () => queryClient.getQueryData<Revisioned>(queryKey),
      write: (update) => queryClient.setQueryData<Revisioned>(queryKey, update),
      // The field is already back to the server's value; "Try again" sends what was typed
      // (nothing is queued to go by itself later)
      onFail: (err, changes) =>
        toast.error(getErrorMessage(err), {
          id: QUIET_ERROR_TOAST,
          action: {
            label: t('retry'),
            onClick: () => {
              const now = queryClient.getQueryData<DnD5eCharacter>(queryKey);
              if (now) quiet.push(applyChanges(now, changes), changes).catch(() => {});
            },
          },
        }),
    });
    return quiet;
    // getErrorMessage and t only change with the language
  }, [id, queryKey, queryClient, getErrorMessage, t]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // A tap still saving would come back undone: fetch once the server has it
      await saver.settled();
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
      await saver.settled();
      // The revision the draft sits on, taken after the taps (they move it, see QuietSaver)
      const revision = queryClient.getQueryData<Revisioned>(queryKey)?.revision;
      const result = await rpgWorldApi.put<SaveResult>(`/api/characters/${character.id}`, {
        updates: changes,
        ...(revision !== undefined && { revision }),
      });
      return result?.revision;
    },
    onSuccess: (revision, { character }) => {
      setConflict(false);
      // Optimistically update the cache with the data we just saved
      queryClient.setQueryData<Revisioned>(queryKey, {
        ...character,
        ...(typeof revision === 'number' && { revision }),
      });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      // The save bar says it, with Reload: a toast would only repeat it
      if (isConflict(err)) setConflict(true);
      else toast.error(getErrorMessage(err));
    },
  });

  // A page going away sends what is still waiting at once, instead of after the request in flight
  useEffect(() => {
    const flush = () => saver.flush();
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [saver]);

  /**
   * Saves what changes during play (a tap on a hit die, a resource box, the HP) in the background.
   * The sheet shows `character` at once and nothing else on screen reacts: no "Saving…", no lock,
   * no refetch afterwards. When the save fails it rejects, after putting those fields back as
   * the server has them and showing the error with "Try again".
   */
  const saveQuietly = useCallback(
    ({ character, changes }: { character: DnD5eCharacter; changes: Partial<DnD5eCharacter> }) => {
      // A refetch still in flight would bring back the copy from before this change
      void queryClient.cancelQueries({ queryKey });
      return saver.push(character, changes);
    },
    [queryClient, queryKey, saver],
  );

  /** Fetches the server's copy again after a conflict; the draft stays on top of it. */
  const reload = useCallback(() => {
    setConflict(false);
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    character,
    isLoading: query.isLoading,
    error: query.error,
    updateCharacter: updateMutation.mutateAsync,
    saveQuietly,
    isSaving: updateMutation.isPending,
    conflict,
    reload,
  };
}
