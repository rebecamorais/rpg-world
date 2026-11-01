import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { PARTIES_QUERY_KEY, partyQueryKey } from '@frontend/lib/query-keys';

import type { MemberStatus } from '@backend/contexts/parties/domain/Party';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

/** A party page and everything done on it; each change reloads the page and the party list. */
export function useParty(partyId: string) {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useErrorMessage();
  const base = `/api/parties/${partyId}`;

  const query = useQuery({
    queryKey: partyQueryKey(partyId),
    queryFn: () => rpgWorldApi.get<PartyView>(base),
    enabled: !!partyId,
    retry: false,
  });

  const onSettled = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: partyQueryKey(partyId) }),
      queryClient.invalidateQueries({ queryKey: PARTIES_QUERY_KEY }),
    ]);
  const onError = (err: Error) => toast.error(getErrorMessage(err));
  const options = { onSettled, onError };

  const rename = useMutation({
    mutationFn: (name: string) => rpgWorldApi.patch(base, { name }),
    ...options,
  });
  const remove = useMutation({ mutationFn: () => rpgWorldApi.delete(base), ...options });
  const rotateCode = useMutation({
    mutationFn: () => rpgWorldApi.post<{ code: string }>(`${base}/invite-code`),
    ...options,
  });
  const invite = useMutation({
    mutationFn: async (username: string) => {
      const { status } = await rpgWorldApi.post<{ status: MemberStatus }>(`${base}/invites`, {
        username,
      });
      return status;
    },
    ...options,
  });
  const acceptMember = useMutation({
    mutationFn: (userId: string) => rpgWorldApi.patch(`${base}/members/${userId}`),
    ...options,
  });
  const removeMember = useMutation({
    mutationFn: (userId: string) => rpgWorldApi.delete(`${base}/members/${userId}`),
    ...options,
  });
  const setMyCharacters = useMutation({
    mutationFn: (characterIds: string[]) =>
      rpgWorldApi.put(`${base}/my-characters`, { characterIds }),
    ...options,
  });

  return {
    party: query.data,
    isLoading: query.isLoading,
    error: query.error,
    rename,
    remove,
    rotateCode,
    invite,
    acceptMember,
    removeMember,
    setMyCharacters,
  };
}
