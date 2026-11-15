import { useCallback, useRef } from 'react';

import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { Spell } from '@frontend/types/spells';

export type CharacterSpell = Spell;

type SpellAction = 'learn' | 'forget' | 'prepare' | 'unprepare';

interface SpellWrite {
  id: string;
  action: SpellAction;
  silent?: boolean;
}

/**
 * Shared by every spellbook write, so a card can tell its own spell is being saved. Per
 * character: two characters can have the same spell, and one's save must not lock the other's.
 * Without an id it is the prefix of every character's writes.
 */
const spellWriteKey = (characterId?: string) =>
  characterId ? ['character-spells-write', characterId] : ['character-spells-write'];

/**
 * One toast for learn, prepare and unprepare: a run of taps replaces it instead of stacking a
 * pile. Forgetting has its own (with Undo), which these never replace.
 */
const SPELL_WRITE_TOAST = 'spell-write';

/** The spellbook after an action the server confirmed; learning brings the learned spell. */
function applyAction(
  spells: CharacterSpell[],
  id: string,
  action: SpellAction,
  learned: CharacterSpell | null,
): CharacterSpell[] {
  switch (action) {
    case 'learn':
      return learned && !spells.some((s) => s.id === id) ? [...spells, learned] : spells;
    case 'forget':
      return spells.filter((s) => s.id !== id);
    case 'prepare':
    case 'unprepare':
      return spells.map((s) => (s.id === id ? { ...s, isPrepared: action === 'prepare' } : s));
  }
}

/**
 * Whether a write to this spell is on its way. Per spell, not one flag for the whole list: the
 * other cards stay usable while one saves.
 */
export function useIsSpellPending(id: string, characterId?: string): boolean {
  const pending = useMutationState({
    filters: {
      mutationKey: spellWriteKey(characterId),
      status: 'pending',
      predicate: (mutation) => (mutation.state.variables as SpellWrite | undefined)?.id === id,
    },
    select: () => true,
  });
  return pending.length > 0;
}

export function useCharacterSpells(
  characterId: string | undefined,
  options: { enabled?: boolean } = { enabled: true },
) {
  const queryToKey = ['character-spells', characterId];
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('spellsDrawer.toasts');
  const tConfirm = useTranslations('spellsDrawer.forgetConfirm');
  const confirm = useConfirm();
  const { getErrorMessage } = useErrorMessage();
  const { apiPath } = useSheetSource(characterId ?? '');
  // Checked and set in the same tick as the click: a double click lands before React re-renders
  // the disabled button, and must not send a second request
  const inFlight = useRef(new Set<string>());

  const {
    data: spells = [],
    isLoading,
    error,
  } = useQuery<CharacterSpell[]>({
    queryKey: [...queryToKey, locale],
    queryFn: async () => {
      if (!characterId) return [];
      return rpgWorldApi.get(`${apiPath}/spells?locale=${locale}`);
    },
    enabled: options.enabled && !!characterId,
  });

  // Not optimistic: the cache only changes with the server's answer, so a failed write has
  // nothing to roll back. Meanwhile the card shows it is saving (useIsSpellPending).
  const mutation = useMutation({
    mutationKey: spellWriteKey(characterId),
    mutationFn: async ({ id, action }: SpellWrite): Promise<{ spell: CharacterSpell | null }> => {
      return rpgWorldApi.post(`/api/characters/${characterId}/spells?locale=${locale}`, {
        id,
        action,
      });
    },
    onSuccess: ({ spell }, { id, action, silent }) => {
      // The answer is enough to update the spellbook: no second request for the whole list
      queryClient.setQueryData<CharacterSpell[]>([...queryToKey, locale], (current = []) =>
        applyAction(current, id, action, spell),
      );
      // Other languages' copies are stale now; they refetch when shown
      queryClient.invalidateQueries({
        queryKey: queryToKey,
        predicate: (query) => query.queryKey[2] !== locale,
      });
      if (silent) return;

      const toastOptions = { id: SPELL_WRITE_TOAST };
      if (action === 'learn') toast.success(t('learned'), toastOptions);
      if (action === 'prepare') toast.success(t('prepared'), toastOptions);
      if (action === 'unprepare') toast.success(t('unprepared'), toastOptions);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Stable callbacks: the spell cards are memoized and receive them as props
  const { mutateAsync } = mutation;

  /**
   * One write per spell at a time: a tap while it saves is dropped. True once the server took it;
   * a failure was already told by the error toast.
   */
  const write = useCallback(
    async (vars: SpellWrite): Promise<boolean> => {
      if (inFlight.current.has(vars.id)) return false;
      inFlight.current.add(vars.id);
      try {
        await mutateAsync(vars);
        return true;
      } catch {
        return false;
      } finally {
        inFlight.current.delete(vars.id);
      }
    },
    [mutateAsync],
  );

  const learnSpell = useCallback((id: string) => write({ id, action: 'learn' }), [write]);

  const togglePrepared = useCallback(
    (id: string, isPrepared: boolean) =>
      write({ id, action: isPrepared ? 'prepare' : 'unprepare' }),
    [write],
  );

  /**
   * Asks first: in the search the learned check sits where the learn button was, and one stray
   * tap forgot the spell. The toast still offers to undo it (prepared state included).
   */
  const forgetSpell = useCallback(
    async (id: string) => {
      if (inFlight.current.has(id)) return;
      const spell = spells.find((s) => s.id === id);
      const ok = await confirm({
        description: spell
          ? tConfirm('description', { name: spell.name })
          : tConfirm('descriptionUnnamed'),
        confirmLabel: tConfirm('confirm'),
        destructive: true,
      });
      if (!ok) return;

      const wasPrepared = spell?.isPrepared ?? false;
      if (!(await write({ id, action: 'forget' }))) return;

      toast.success(t('forgotten'), {
        // One per spell: forgetting it again replaces the toast instead of stacking another
        id: `spell-forgotten-${id}`,
        action: {
          label: t('undo'),
          onClick: async () => {
            const learned = await write({ id, action: 'learn', silent: true });
            if (learned && wasPrepared) await write({ id, action: 'prepare', silent: true });
          },
        },
      });
    },
    [spells, write, confirm, t, tConfirm],
  );

  return {
    spells,
    isLoading,
    error,
    learnSpell,
    forgetSpell,
    togglePrepared,
    isUpdating: mutation.isPending,
  };
}
