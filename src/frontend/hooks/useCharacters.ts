import { useQuery } from '@tanstack/react-query';

import type { CharacterSummary } from '@/shared/types/character';

export function useCharacters(currentUser: { username: string } | null) {
  const query = useQuery({
    queryKey: ['characters', currentUser?.username],
    queryFn: async () => {
      const res = await fetch(
        `/api/characters?ownerUsername=${encodeURIComponent(currentUser!.username)}`,
      );
      if (!res.ok) throw new Error('Failed to fetch characters');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      return data as CharacterSummary[];
    },
    enabled: !!currentUser,
  });

  return {
    characters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
