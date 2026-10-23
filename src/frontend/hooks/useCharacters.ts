import { useQuery } from '@tanstack/react-query';

import { rpgWorldApi } from '@client';

import { CHARACTERS_QUERY_KEY } from '@frontend/lib/query-keys';

import type { CharacterSummary } from '@shared/types/character';

export function useCharacters() {
  const query = useQuery({
    queryKey: CHARACTERS_QUERY_KEY,
    queryFn: async () => {
      const data = await rpgWorldApi.get<CharacterSummary[]>('/api/characters');
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
