import { useRouter } from 'next/navigation';

import { RPGWorldApi } from '@client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { DnD5eCharacter } from '@/shared/systems/dnd5e';

export function useCharacter(
  id: string,
  currentUser: { username: string } | null,
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      try {
        const data = await RPGWorldApi.get<DnD5eCharacter>(
          `/api/characters/${id}`,
        );
        return data;
      } catch (error: unknown) {
        throw error;
      }
    },
    enabled: !!id && !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      try {
        await RPGWorldApi.delete(
          `/api/characters/${character.id}?ownerUsername=${encodeURIComponent(currentUser?.username || '')}`,
        );
      } catch (error: unknown) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] });
      toast.success('Personagem excluído com sucesso.');
      router.push('/');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      try {
        await RPGWorldApi.put(`/api/characters/${character.id}`, {
          ownerUsername: currentUser?.username,
          updates: character,
        });
      } catch (error: unknown) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', id] });
      toast.success('Personagem salvo com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    character: query.data,
    isLoading: query.isLoading,
    error: query.error,
    deleteCharacter: deleteMutation.mutate,
    updateCharacter: updateMutation.mutate,
    isSaving: updateMutation.isPending || deleteMutation.isPending,
  };
}
