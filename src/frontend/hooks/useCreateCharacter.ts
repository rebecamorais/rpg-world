import { useRouter } from 'next/navigation';

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
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || tError);
      }

      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(tSuccess);
      router.push(`/system/${variables.system}/character/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
