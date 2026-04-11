import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { Spell } from '@frontend/types/spells';

export type CharacterSpell = Spell;

export function useCharacterSpells(
  characterId: string | undefined,
  options: { enabled?: boolean } = { enabled: true },
) {
  const queryToKey = ['character-spells', characterId];
  const queryClient = useQueryClient();
  const locale = useLocale();

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

      if (variables.action === 'learn') toast.success('Magia aprendida!');
      if (variables.action === 'forget') toast.success('Magia esquecida.');
      if (variables.action === 'prepare') toast.success('Magia preparada.');
      if (variables.action === 'unprepare') toast.success('Magia não preparada.');
    },
    onError: (error: Error) => {
      toast.error(`Falha ao atualizar magia: ${error.message}`);
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
