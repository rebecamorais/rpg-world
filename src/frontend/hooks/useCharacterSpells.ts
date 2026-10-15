import { useCallback } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { Spell } from '@frontend/types/spells';

export type CharacterSpell = Spell;

type SpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

export function useCharacterSpells(
  characterId: string | undefined,
  options: { enabled?: boolean } = { enabled: true },
) {
  const queryToKey = ['character-spells', characterId];
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('spellsDrawer.toasts');
  const { getErrorMessage } = useErrorMessage();

  const {
    data: spells = [],
    isLoading,
    error,
  } = useQuery<CharacterSpell[]>({
    queryKey: [...queryToKey, locale],
    queryFn: async () => {
      if (!characterId) return [];
      return rpgWorldApi.get(`/api/characters/${characterId}/spells?locale=${locale}`);
    },
    enabled: options.enabled && !!characterId,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: SpellAction; silent?: boolean }) => {
      return rpgWorldApi.post(`/api/characters/${characterId}/spells`, { id, action });
    },
    onSuccess: (_, { action, silent }) => {
      queryClient.invalidateQueries({ queryKey: queryToKey });
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
