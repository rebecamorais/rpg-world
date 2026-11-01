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
    // Without a combat the API answers 204, which the client turns into {}
    queryFn: async () => {
      const view = await rpgWorldApi.get<EncounterView | Record<string, never>>(base);
      return 'role' in view ? view : null;
    },
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
    mutationFn: (input: { characterId: string; count?: number; side?: 'ally' | 'enemy' }) =>
      rpgWorldApi.post(`${base}/participants`, input),
    ...options,
  });
  const updateParticipant = useMutation({
    mutationFn: ({ participantId, ...patch }: ParticipantPatch & { participantId: string }) =>
      rpgWorldApi.patch(`${base}/participants/${participantId}`, patch),
    // Shown at once: "Sort by initiative" clicked right after typing the last one must see it
    onMutate: async ({ participantId, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: encounterQueryKey(partyId) });
      queryClient.setQueryData<EncounterView | null>(encounterQueryKey(partyId), (view) =>
        view?.role === 'gm'
          ? {
              ...view,
              rows: view.rows.map((row) =>
                row.participantId === participantId
                  ? {
                      ...row,
                      name: patch.label ?? row.name,
                      initiative:
                        patch.initiative === undefined ? row.initiative : patch.initiative,
                      hp: {
                        ...row.hp,
                        current: patch.hpCurrent ?? row.hp.current,
                        temp: patch.hpTemp ?? row.hp.temp,
                      },
                    }
                  : row,
              ),
            }
          : view,
      );
    },
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
