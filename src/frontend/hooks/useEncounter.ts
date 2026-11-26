import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { encounterQueryKey } from '@frontend/lib/query-keys';

import type {
  ActiveCondition,
  EncounterView,
  NpcSide,
} from '@backend/contexts/combat/domain/Encounter';
import type {
  ConditionChange,
  ParticipantPatch,
} from '@backend/contexts/combat/domain/repository/combat.repo';

type Snapshot = { previous: EncounterView | null | undefined };

/**
 * The changes from `before` to `after`, one per condition: the picker hands over the whole list,
 * but sending the list back would undo what someone else switched meanwhile.
 */
export function conditionChanges(
  before: ActiveCondition[],
  after: ActiveCondition[],
): ConditionChange[] {
  const was = new Map(before.map((c) => [c.key, c]));
  const is = new Map(after.map((c) => [c.key, c]));
  const changes: ConditionChange[] = [];
  for (const { key, level } of after) {
    const previous = was.get(key);
    if (!previous || previous.level !== level) changes.push({ key, active: true, level });
  }
  for (const { key } of before) if (!is.has(key)) changes.push({ key, active: false });
  return changes;
}

/** `conditions` with `change` applied, as the database does it (in place, or at the end). */
function applyChange(conditions: ActiveCondition[], change: ConditionChange): ActiveCondition[] {
  if (!change.active) return conditions.filter((c) => c.key !== change.key);
  const next = { key: change.key, level: change.level };
  return conditions.some((c) => c.key === change.key)
    ? conditions.map((c) => (c.key === change.key ? next : c))
    : [...conditions, next];
}

/** The participant's conditions as the cache has them (the GM's rows, or the player's turns). */
function conditionsIn(view: EncounterView | null | undefined, participantId: string) {
  if (view?.role === 'gm')
    return view.rows.find((r) => r.participantId === participantId)?.conditions;
  if (view?.role === 'player') {
    return view.turns.find((t) => t.participantId === participantId)?.conditions;
  }
  return undefined;
}

/** The party's combat (null without one) and everything done on it; each change reloads it. */
export function useEncounter(partyId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('combat');
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

  // Every change shares the key: refetching while another one is still on its way would read the
  // database before it's saved and undo it on screen ("Sort by initiative" would then see the old
  // value). Only the last one to finish refetches (it still counts as running in onSettled). The
  // refetch isn't awaited: a change is done once the server answers, so the next one to finish,
  // or a broadcast (usePartyChannel), fetches again instead of trusting a fetch already under way
  const mutationKey = encounterQueryKey(partyId);
  const onSettled = () => {
    if (queryClient.isMutating({ mutationKey }) === 1) {
      void queryClient.invalidateQueries({ queryKey: encounterQueryKey(partyId) });
    }
  };
  const onError = (err: Error) => toast.error(getErrorMessage(err));
  const options = { mutationKey, onSettled, onError };

  // Optimistic changes take a snapshot and go back to it on failure. Only when nothing else is on
  // its way: going back then would also undo the newer change on screen; the refetch of the last
  // change to finish fixes the screen instead
  const snapshot = async (): Promise<Snapshot> => {
    await queryClient.cancelQueries({ queryKey: encounterQueryKey(partyId) });
    return { previous: queryClient.getQueryData<EncounterView | null>(encounterQueryKey(partyId)) };
  };
  const rollback = (err: Error, _vars: unknown, context: Snapshot | undefined) => {
    if (context && queryClient.isMutating({ mutationKey }) === 1) {
      queryClient.setQueryData(encounterQueryKey(partyId), context.previous);
    }
    onError(err);
  };

  const create = useMutation({ mutationFn: () => rpgWorldApi.post(base), ...options });
  const finish = useMutation({ mutationFn: () => rpgWorldApi.delete(base), ...options });
  const start = useMutation({ mutationFn: () => rpgWorldApi.post(`${base}/start`), ...options });
  const addParticipant = useMutation({
    mutationFn: (input: { characterId: string; count?: number; side?: NpcSide }) =>
      rpgWorldApi.post(`${base}/participants`, input),
    ...options,
  });
  // The party's characters in one go: every one is sent, so one failure doesn't stop the rest,
  // and one toast says how many didn't make it instead of one toast per character
  const addParticipants = useMutation({
    mutationFn: async (characterIds: string[]) => {
      const results = await Promise.allSettled(
        characterIds.map((characterId) =>
          rpgWorldApi.post(`${base}/participants`, { characterId }),
        ),
      );
      const failures = results.flatMap((r) => (r.status === 'rejected' ? [r.reason as Error] : []));
      // Nobody made it: an ordinary failure, with its own message
      if (failures.length === characterIds.length && failures.length > 0) throw failures[0];
      return failures;
    },
    ...options,
    onSuccess: (failures) => {
      if (failures.length === 0) return;
      const reason = getErrorMessage(failures[0]);
      toast.error(t('addPartyCharactersPartial', { failed: failures.length, reason }));
    },
  });
  const updateParticipant = useMutation({
    mutationFn: ({ participantId, ...patch }: ParticipantPatch & { participantId: string }) =>
      rpgWorldApi.patch(`${base}/participants/${participantId}`, patch),
    // Shown at once: "Sort by initiative" clicked right after typing the last one must see it
    onMutate: async ({ participantId, ...patch }) => {
      const context = await snapshot();
      queryClient.setQueryData<EncounterView | null>(encounterQueryKey(partyId), (view) =>
        view?.role === 'gm'
          ? {
              ...view,
              rows: view.rows.map((row) =>
                row.participantId === participantId
                  ? {
                      ...row,
                      name: patch.label ?? row.name,
                      side: patch.side ?? row.side,
                      visibility: patch.visibility ?? row.visibility,
                      initiative:
                        patch.initiative === undefined ? row.initiative : patch.initiative,
                      fate: patch.fate === undefined ? row.fate : patch.fate,
                      // Mirrors the database: only a dead npc can be revealed as dead
                      deathRevealed:
                        patch.fate !== undefined && patch.fate !== 'dead'
                          ? false
                          : (patch.deathRevealed ?? row.deathRevealed),
                      deathSaves:
                        patch.deathSaves ??
                        (patch.fate === undefined
                          ? row.deathSaves
                          : patch.fate === 'death_saves'
                            ? (row.deathSaves ?? { successes: 0, failures: 0 })
                            : null),
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
      return context;
    },
    ...options,
    onError: rollback,
  });
  const removeParticipant = useMutation({
    mutationFn: (participantId: string) =>
      rpgWorldApi.delete(`${base}/participants/${participantId}`),
    ...options,
  });
  const setOrder = useMutation({
    mutationFn: (participantIds: string[]) => rpgWorldApi.put(`${base}/order`, { participantIds }),
    // Shown at once; a fetch already on its way read the old order, so it's cancelled
    onMutate: async (participantIds) => {
      const context = await snapshot();
      queryClient.setQueryData<EncounterView | null>(encounterQueryKey(partyId), (view) => {
        if (view?.role !== 'gm') return view;
        const position = new Map(participantIds.map((id, index) => [id, index]));
        const rank = (id: string) => position.get(id) ?? participantIds.length;
        return {
          ...view,
          rows: [...view.rows].sort((a, b) => rank(a.participantId) - rank(b.participantId)),
        };
      });
      return context;
    },
    ...options,
    onError: rollback,
  });
  const endTurn = useMutation({
    mutationFn: (participantId: string) => rpgWorldApi.post(`${base}/turn`, { participantId }),
    ...options,
  });
  const previousTurn = useMutation({
    mutationFn: () => rpgWorldApi.post(`${base}/turn/previous`),
    ...options,
  });
  const setMyInitiative = useMutation({
    mutationFn: ({
      participantId,
      initiative,
    }: {
      participantId: string;
      initiative: number | null;
    }) => rpgWorldApi.put(`${base}/participants/${participantId}/initiative`, { initiative }),
    // Shown at once, on the player's own row
    onMutate: async ({ participantId, initiative }) => {
      const context = await snapshot();
      queryClient.setQueryData<EncounterView | null>(encounterQueryKey(partyId), (view) =>
        view?.role === 'player'
          ? {
              ...view,
              turns: view.turns.map((turn) =>
                turn.participantId === participantId ? { ...turn, initiative } : turn,
              ),
            }
          : view,
      );
      return context;
    },
    ...options,
    onError: rollback,
  });

  /** Applies `change` to the participant's conditions in the cache (rows for the GM, turns too). */
  const showChange = (participantId: string, change: ConditionChange) =>
    queryClient.setQueryData<EncounterView | null>(encounterQueryKey(partyId), (view) => {
      if (view?.role === 'gm') {
        return {
          ...view,
          rows: view.rows.map((row) =>
            row.participantId === participantId
              ? { ...row, conditions: applyChange(row.conditions, change) }
              : row,
          ),
        };
      }
      if (view?.role === 'player') {
        return {
          ...view,
          turns: view.turns.map((turn) =>
            turn.participantId === participantId
              ? { ...turn, conditions: applyChange(turn.conditions, change) }
              : turn,
          ),
        };
      }
      return view;
    });

  // One condition per request, so the GM and a player switching different ones keep both. They go
  // one at a time (scope): on, then off, of the same condition can't arrive the other way round
  const changeCondition = useMutation({
    mutationFn: ({ participantId, change }: { participantId: string; change: ConditionChange }) =>
      rpgWorldApi.patch(`${base}/participants/${participantId}/conditions`, change),
    scope: { id: `conditions-${partyId}` },
    onMutate: async ({ participantId, change }) => {
      const before = conditionsIn(
        queryClient.getQueryData<EncounterView | null>(encounterQueryKey(partyId)),
        participantId,
      );
      await queryClient.cancelQueries({ queryKey: encounterQueryKey(partyId) });
      showChange(participantId, change);
      return { before: before?.find((c) => c.key === change.key) };
    },
    ...options,
    // Undoes only this switch (back to how that condition was), not the others still on their way
    onError: (err, { participantId, change }, context) => {
      const was = context?.before;
      showChange(
        participantId,
        was ? { key: was.key, active: true, level: was.level } : { key: change.key, active: false },
      );
      onError(err);
    },
  });

  /**
   * Takes the whole list the picker builds (same call as before) and sends only what changed from
   * what is on screen, one condition at a time.
   */
  const setConditions = {
    mutate: ({
      participantId,
      conditions,
    }: {
      participantId: string;
      conditions: ActiveCondition[];
    }) => {
      const view = queryClient.getQueryData<EncounterView | null>(encounterQueryKey(partyId));
      const before = conditionsIn(view, participantId) ?? [];
      for (const change of conditionChanges(before, conditions)) {
        changeCondition.mutate({ participantId, change });
      }
    },
    isPending: changeCondition.isPending,
  };

  return {
    encounter: query.data,
    isLoading: query.isLoading,
    // A failed load isn't "no combat": the GM would be offered to prepare one that already exists
    isError: query.isError,
    refetch: query.refetch,
    create,
    finish,
    start,
    addParticipant,
    addParticipants,
    updateParticipant,
    removeParticipant,
    setOrder,
    endTurn,
    previousTurn,
    setMyInitiative,
    setConditions,
  };
}
