import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { PARTIES_QUERY_KEY } from '@frontend/lib/query-keys';

import type { MyParties } from '@backend/contexts/parties/domain/Party';

interface Answer {
  partyId: string;
  userId: string;
  accept: boolean;
}

// Its own key, apart from the parties query: the party channel waits on mutations under that one
const RESPOND_KEY = ['parties-respond'] as const;

/**
 * The person's parties (as GM and player), their invitations and pending requests. Also used by
 * the phone menu, which renders outside the dashboard's UserProvider.
 */
export function useParties() {
  const queryClient = useQueryClient();
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
    mutationKey: RESPOND_KEY,
    mutationFn: ({ partyId, userId, accept }: Answer) => {
      const url = `/api/parties/${partyId}/members/${userId}`;
      return accept ? rpgWorldApi.patch(url) : rpgWorldApi.delete(url);
    },
    onSettled,
    onError,
  });

  // Every answer still on its way, not only the last one: each row waits on its own
  const pendingAnswers = useMutationState({
    filters: { mutationKey: RESPOND_KEY, status: 'pending' },
    select: (mutation) => mutation.state.variables as Answer | undefined,
  });

  return {
    parties: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createParty: create.mutateAsync,
    isCreating: create.isPending,
    respond: respond.mutate,
    /** The answer about this party on its way, if any: accepting, or declining / withdrawing. */
    respondingTo: (partyId: string): 'accept' | 'decline' | undefined => {
      const answer = pendingAnswers.find((a) => a?.partyId === partyId);
      if (!answer) return undefined;
      return answer.accept ? 'accept' : 'decline';
    },
  };
}
