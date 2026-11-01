import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { CHARACTERS_QUERY_KEY } from '@frontend/lib/query-keys';

import type { CharacterSummary } from '@shared/types/character';

/** Copies a sheet (sheet, lore and spells; not the avatar) as "<name> (copy)" and opens the copy. */
export function useDuplicateCharacter() {
  const t = useTranslations('characters');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { getErrorMessage } = useErrorMessage();

  return useMutation({
    mutationFn: (character: CharacterSummary) =>
      rpgWorldApi.post<{ id: string }>(`/api/characters/${character.id}/duplicate`, {
        name: t('copyName', { name: character.name }),
      }),
    onSuccess: (data, character) => {
      queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY });
      toast.success(t('duplicateSuccess'));
      router.push(`/system/${character.system}/character/${data.id}`);
    },
    onError: (error: Error) => toast.error(getErrorMessage(error)),
  });
}
