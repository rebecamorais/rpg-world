import { useRouter } from 'next/navigation';

import { useErrorMessage } from '@/frontend/hooks/useErrorMessage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

interface CreateCharacterVariables {
  name: string;
  system: string;
  ownerUsername: string;
}

export function useCreateCharacter(tSuccess: string, tError: string) {
  const queryClient = useQueryClient();
  const { getMessage } = useErrorMessage();
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CreateCharacterVariables) => {
      try {
        const data = await rpgWorldApi.post<{ id: string }>('/api/characters', variables);
        return data;
      } catch (error: unknown) {
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(tSuccess);
      router.push(`/system/${variables.system}/character/${data.id}`);
    },
    onError: (error: Error) => {
      const errorCode = error.message;
      toast.error(`${tError}: ${getMessage(errorCode)}`);
    },
  });
}
