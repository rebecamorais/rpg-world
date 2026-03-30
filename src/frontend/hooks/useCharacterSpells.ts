import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

export type CharacterSpell = {
  spellId: string;
  name: string;
  level: number;
  school: string;
  isPrepared: boolean;
};

export function useCharacterSpells(characterId: string | undefined) {
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
    enabled: !!characterId,
  });

  const mutation = useMutation({
    mutationFn: async ({
      spellId,
      action,
    }: {
      spellId: string;
      action: 'learn' | 'forget' | 'prepare' | 'unprepare';
    }) => {
      return rpgWorldApi.post(`/api/characters/${characterId}/spells`, { spellId, action });
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
    learnSpell: (spellId: string) => mutation.mutate({ spellId, action: 'learn' }),
    forgetSpell: (spellId: string) => mutation.mutate({ spellId, action: 'forget' }),
    togglePrepared: (spellId: string, isPrepared: boolean) =>
      mutation.mutate({ spellId, action: isPrepared ? 'prepare' : 'unprepare' }),
    isUpdating: mutation.isPending,
  };
}
