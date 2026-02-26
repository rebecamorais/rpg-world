import { useRouter } from 'next/navigation';

import { rpgWorldApi } from '@client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { DnD5eCharacter } from '@/shared/systems/dnd5e';

export function useCharacter(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const data = await rpgWorldApi.get<DnD5eCharacter>(
        `/api/characters/${id}`,
      );
      return data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      await rpgWorldApi.delete(`/api/characters/${character.id}`);
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
      await rpgWorldApi.put(`/api/characters/${character.id}`, {
        updates: character,
      });
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
