import { useRouter } from 'next/navigation';

import { RPGWorldApi } from '@client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateCharacterVariables {
  name: string;
  system: string;
  ownerUsername: string;
}

export function useCreateCharacter(tSuccess: string, tError: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (variables: CreateCharacterVariables) => {
      try {
        const data = await RPGWorldApi.post<{ id: string }>(
          '/api/characters',
          variables,
        );
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
      toast.error(`${tError}: ${error.message}`);
    },
  });
}
