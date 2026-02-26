import { rpgWorldApi } from '@client';
import { useQuery } from '@tanstack/react-query';

import type { CharacterSummary } from '@/shared/types/character';

export function useCharacters(currentUser: { username: string } | null) {
  const query = useQuery({
    queryKey: ['characters', currentUser?.username],
    queryFn: async () => {
      try {
        const data = await rpgWorldApi.get<CharacterSummary[]>(
          `/api/characters?ownerUsername=${encodeURIComponent(currentUser!.username)}`,
        );
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        return data;
      } catch (error: unknown) {
        throw error;
      }
    },
    enabled: !!currentUser,
  });

  return {
    characters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
