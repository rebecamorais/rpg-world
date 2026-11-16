import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import type { ClassChoiceSelections } from '@shared/systems/dnd5e/class-choices';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

interface CreateCharacterVariables {
  name: string;
  system: string;
  edition?: Edition;
  /** A class id from the list, or the player's own text. */
  class?: string;
  /** The class's picks, by the choice's identity; the server keeps only the valid ones. */
  classChoices?: ClassChoiceSelections;
  kind?: 'npc';
}

/** Creates a character and opens its sheet. Errors are left to the form, which shows them inline. */
export function useCreateCharacter(tSuccess: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // The owner is the session's user, set by the API
    mutationFn: (variables: CreateCharacterVariables) =>
      rpgWorldApi.post<{ id: string }>('/api/characters', variables),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(tSuccess);
      router.push(`/system/${variables.system}/character/${data.id}`);
    },
  });
}
