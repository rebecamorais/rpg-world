import { rpgWorldApi } from '@client';
import { useQuery } from '@tanstack/react-query';

import type { CharacterSummary } from '@/shared/types/character';
import type { User } from '@/shared/types/user';

export function useCharacters(currentUser: User | null) {
  const query = useQuery({
    queryKey: ['characters', currentUser?.id],
    queryFn: async () => {
      try {
        const data = await rpgWorldApi.get<CharacterSummary[]>(
          `/api/characters?ownerUsername=${encodeURIComponent(currentUser!.id)}`,
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
