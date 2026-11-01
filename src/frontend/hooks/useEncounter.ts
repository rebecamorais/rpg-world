import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { encounterQueryKey } from '@frontend/lib/query-keys';

import type { EncounterView } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

/** The party's combat (null without one) and everything done on it; each change reloads it. */
export function useEncounter(partyId: string) {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useErrorMessage();
  const base = `/api/parties/${partyId}/encounter`;

  const query = useQuery({
    queryKey: encounterQueryKey(partyId),
    // 204 (no combat) comes back empty
    queryFn: async () => (await rpgWorldApi.get<EncounterView | null>(base)) ?? null,
    enabled: !!partyId,
    retry: false,
  });

  const onSettled = () => queryClient.invalidateQueries({ queryKey: encounterQueryKey(partyId) });
  const onError = (err: Error) => toast.error(getErrorMessage(err));
  const options = { onSettled, onError };

  const create = useMutation({ mutationFn: () => rpgWorldApi.post(base), ...options });
  const finish = useMutation({ mutationFn: () => rpgWorldApi.delete(base), ...options });
  const start = useMutation({ mutationFn: () => rpgWorldApi.post(`${base}/start`), ...options });
  const addParticipant = useMutation({
    mutationFn: (input: { characterId: string; count?: number }) =>
      rpgWorldApi.post(`${base}/participants`, input),
    ...options,
  });
  const updateParticipant = useMutation({
    mutationFn: ({ participantId, ...patch }: ParticipantPatch & { participantId: string }) =>
      rpgWorldApi.patch(`${base}/participants/${participantId}`, patch),
    ...options,
  });
  const removeParticipant = useMutation({
    mutationFn: (participantId: string) =>
      rpgWorldApi.delete(`${base}/participants/${participantId}`),
    ...options,
  });
  const setOrder = useMutation({
    mutationFn: (participantIds: string[]) => rpgWorldApi.put(`${base}/order`, { participantIds }),
    ...options,
  });
  const endTurn = useMutation({
    mutationFn: (participantId: string) => rpgWorldApi.post(`${base}/turn`, { participantId }),
    ...options,
  });

  return {
    encounter: query.data,
    isLoading: query.isLoading,
    create,
    finish,
    start,
    addParticipant,
    updateParticipant,
    removeParticipant,
    setOrder,
    endTurn,
  };
}
