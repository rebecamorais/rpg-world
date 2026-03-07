import { rpgWorldApi } from '@client';
import type { CharacterSummary } from '@shared/types/character';
import { useQuery } from '@tanstack/react-query';

export function useCharacters() {
  const query = useQuery({
    queryKey: ['characters'],
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
