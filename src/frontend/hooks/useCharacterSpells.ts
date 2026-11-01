import { useCallback } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { Spell } from '@frontend/types/spells';

export type CharacterSpell = Spell;

type SpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

/** The spellbook after an action the server confirmed; learning brings the learned spell. */
function applyAction(
  spells: CharacterSpell[],
  id: string,
  action: SpellAction,
  learned: CharacterSpell | null,
): CharacterSpell[] {
  switch (action) {
    case 'learn':
      return learned && !spells.some((s) => s.id === id) ? [...spells, learned] : spells;
    case 'forget':
      return spells.filter((s) => s.id !== id);
    case 'prepare':
    case 'unprepare':
      return spells.map((s) => (s.id === id ? { ...s, isPrepared: action === 'prepare' } : s));
  }
}

export function useCharacterSpells(
  characterId: string | undefined,
  options: { enabled?: boolean } = { enabled: true },
) {
  const queryToKey = ['character-spells', characterId];
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('spellsDrawer.toasts');
  const { getErrorMessage } = useErrorMessage();
  const { apiPath } = useSheetSource(characterId ?? '');

  const {
    data: spells = [],
    isLoading,
    error,
  } = useQuery<CharacterSpell[]>({
    queryKey: [...queryToKey, locale],
    queryFn: async () => {
      if (!characterId) return [];
      return rpgWorldApi.get(`${apiPath}/spells?locale=${locale}`);
    },
    enabled: options.enabled && !!characterId,
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: SpellAction;
      silent?: boolean;
    }): Promise<{ spell: CharacterSpell | null }> => {
      return rpgWorldApi.post(`/api/characters/${characterId}/spells?locale=${locale}`, {
        id,
        action,
      });
    },
    onSuccess: ({ spell }, { id, action, silent }) => {
      // The answer is enough to update the spellbook: no second request for the whole list
      queryClient.setQueryData<CharacterSpell[]>([...queryToKey, locale], (current = []) =>
        applyAction(current, id, action, spell),
      );
      // Other languages' copies are stale now; they refetch when shown
      queryClient.invalidateQueries({
        queryKey: queryToKey,
        predicate: (query) => query.queryKey[2] !== locale,
      });
      if (silent) return;

      if (action === 'learn') toast.success(t('learned'));
      if (action === 'prepare') toast.success(t('prepared'));
      if (action === 'unprepare') toast.success(t('unprepared'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Stable callbacks: the spell cards are memoized and receive them as props
  const { mutateAsync } = mutation;

  const learnSpell = useCallback(
    (id: string) => mutateAsync({ id, action: 'learn' }),
    [mutateAsync],
  );

  const togglePrepared = useCallback(
    (id: string, isPrepared: boolean) =>
      mutateAsync({ id, action: isPrepared ? 'prepare' : 'unprepare' }),
    [mutateAsync],
  );

  /** Forgetting is one click away, so it can be undone from the toast (prepared state included). */
  const forgetSpell = useCallback(
    async (id: string) => {
      const wasPrepared = spells.find((s) => s.id === id)?.isPrepared ?? false;
      await mutateAsync({ id, action: 'forget' });

      toast.success(t('forgotten'), {
        action: {
          label: t('undo'),
          onClick: async () => {
            await mutateAsync({ id, action: 'learn', silent: true });
            if (wasPrepared) await mutateAsync({ id, action: 'prepare', silent: true });
          },
        },
      });
    },
    [spells, mutateAsync, t],
  );

  return {
    spells,
    isLoading,
    error,
    learnSpell,
    forgetSpell,
    togglePrepared,
    isUpdating: mutation.isPending,
  };
}
