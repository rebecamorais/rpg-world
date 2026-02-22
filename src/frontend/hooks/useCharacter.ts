import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { DnD5eCharacter } from '@/systems/dnd5e';

export function useCharacter(
  id: string,
  currentUser: { username: string } | null,
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const res = await fetch(`/api/characters/${id}`);
      if (!res.ok) throw new Error('Failed to fetch character');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as DnD5eCharacter;
    },
    enabled: !!id && !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      const res = await fetch(
        `/api/characters/${character.id}?ownerUsername=${encodeURIComponent(currentUser?.username || '')}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao deletar personagem.');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character'] });
      toast.success('Personagem excluído com sucesso.');
      router.push('/characters');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (character: DnD5eCharacter) => {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUsername: currentUser?.username,
          updates: character,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao salvar no servidor.');
      }
      return res;
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
