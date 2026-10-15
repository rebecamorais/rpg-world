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

  /** Forgetting is one click away, so it can be undone from the toast (prepared state included). */
  const forgetSpell = async (id: string) => {
    const wasPrepared = spells.find((s) => s.id === id)?.isPrepared ?? false;
    await mutation.mutateAsync({ id, action: 'forget' });

    toast.success(t('forgotten'), {
      action: {
        label: t('undo'),
        onClick: async () => {
          await mutation.mutateAsync({ id, action: 'learn', silent: true });
          if (wasPrepared) await mutation.mutateAsync({ id, action: 'prepare', silent: true });
        },
      },
    });
  };

  return {
    spells,
    isLoading,
    error,
    learnSpell: (id: string) => mutation.mutateAsync({ id, action: 'learn' }),
    forgetSpell,
    togglePrepared: (id: string, isPrepared: boolean) =>
      mutation.mutateAsync({ id, action: isPrepared ? 'prepare' : 'unprepare' }),
    isUpdating: mutation.isPending,
  };
}
