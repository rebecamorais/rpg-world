import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { Spell } from '@frontend/types/spells';

export type CharacterSpell = Spell;

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
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'learn' | 'forget' | 'prepare' | 'unprepare';
    }) => {
      return rpgWorldApi.post(`/api/characters/${characterId}/spells`, { id, action });
    },
    onSuccess: (_, variables) => {
      // Optimistic or simple refetch
      queryClient.invalidateQueries({ queryKey: queryToKey });

      if (variables.action === 'learn') toast.success(t('learned'));
      if (variables.action === 'forget') toast.success(t('forgotten'));
      if (variables.action === 'prepare') toast.success(t('prepared'));
      if (variables.action === 'unprepare') toast.success(t('unprepared'));
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return {
    spells,
    isLoading,
    error,
    learnSpell: (id: string) => mutation.mutateAsync({ id, action: 'learn' }),
    forgetSpell: (id: string) => mutation.mutateAsync({ id, action: 'forget' }),
    togglePrepared: (id: string, isPrepared: boolean) =>
      mutation.mutateAsync({ id, action: isPrepared ? 'prepare' : 'unprepare' }),
    isUpdating: mutation.isPending,
  };
}
