import { useQuery } from '@tanstack/react-query';

import { rpgWorldApi } from '@client';

import { charactersQueryKey } from '@frontend/lib/query-keys';

import type { CharacterKind, CharacterSummary } from '@shared/types/character';

/** The user's playable characters, or their enemy sheets with `kind = 'npc'`. */
export function useCharacters(kind: CharacterKind = 'pc') {
  const query = useQuery({
    queryKey: charactersQueryKey(kind),
    queryFn: async () => {
      const data = await rpgWorldApi.get<CharacterSummary[]>(
        kind === 'pc' ? '/api/characters' : `/api/characters?kind=${kind}`,
      );
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      return data;
    },
  });

  return {
    characters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
