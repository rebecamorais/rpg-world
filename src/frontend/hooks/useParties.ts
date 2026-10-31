import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { PARTIES_QUERY_KEY } from '@frontend/lib/query-keys';

import type { MyParties } from '@backend/contexts/parties/domain/Party';

/** The person's parties (as GM and player), their invitations and pending requests. */
export function useParties() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { getErrorMessage } = useErrorMessage();

  const query = useQuery({
    queryKey: PARTIES_QUERY_KEY,
    queryFn: () => rpgWorldApi.get<MyParties>('/api/parties'),
  });

  const onSettled = () => queryClient.invalidateQueries({ queryKey: PARTIES_QUERY_KEY });
  const onError = (err: Error) => toast.error(getErrorMessage(err));

  const create = useMutation({
    mutationFn: (name: string) => rpgWorldApi.post<{ id: string }>('/api/parties', { name }),
    onSettled,
    onError,
  });

  // Accepting an invite, or declining it / withdrawing a request: always the person's own row
  const respond = useMutation({
    mutationFn: ({ partyId, accept }: { partyId: string; accept: boolean }) => {
      const url = `/api/parties/${partyId}/members/${currentUser?.id}`;
      return accept ? rpgWorldApi.patch(url) : rpgWorldApi.delete(url);
    },
    onSettled,
    onError,
  });

  return {
    parties: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createParty: create.mutateAsync,
    isCreating: create.isPending,
    respond: respond.mutate,
    isResponding: respond.isPending,
  };
}
