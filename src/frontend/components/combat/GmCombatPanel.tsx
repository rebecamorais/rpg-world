'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberInput } from '@frontend/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { useMediaQuery } from '@frontend/hooks/useMediaQuery';
import {
  isSortedByInitiative,
  sortByInitiative,
  tiedNeighbors,
} from '@frontend/lib/initiative-order';
import { cn } from '@frontend/lib/utils';

import {
  type ActiveCondition,
  type GmRow,
  MAX_ENEMIES_PER_ADD,
  type NpcSide,
} from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { CombatConnection } from './CombatConnection';
import { CombatRow } from './CombatRow';
import { SelectedPanel } from './SelectedPanel';
import { TurnBar } from './TurnBar';

const NPC_SIDES: NpcSide[] = ['enemy', 'ally', 'neutral'];
const ADD_LABEL = { enemy: 'addEnemy', ally: 'addAlly', neutral: 'addNeutral' } as const;

/**
 * Who gets the turn back, as `previous_turn` picks it: the last row before the current one that
 * isn't a death the players know of, or else (wrapping, one round back) the last such row. Null at
 * the start, round 1 with nobody playable before the current one, where the server refuses.
 */
function previousPlayable(rows: GmRow[], round: number): GmRow | null {
  const index = rows.findIndex((row) => row.isCurrent);
  if (index < 0) return null;
  const playable = (row: GmRow) => !row.deathRevealed;
  const before = rows.slice(0, index).findLast(playable);
  if (before) return before;
  if (round <= 1) return null;
  // Only revealed deaths left: the server's fallback, so going back never gets stuck
  return rows.findLast(playable) ?? rows[index - 1] ?? rows[rows.length - 1];
}

/**
 * Who gets the turn after the current one, as `end_turn` picks it: the next row that isn't a death
 * the players know of, wrapping to the top; with only revealed deaths left, simply the next row.
 */
function nextPlayable(rows: GmRow[]): GmRow | null {
  const index = rows.findIndex((row) => row.isCurrent);
  if (index < 0) return null;
  const playable = (row: GmRow) => !row.deathRevealed;
  return (
    rows.slice(index + 1).find(playable) ??
    rows.find(playable) ??
    rows[index + 1] ??
    rows[0] ??
    null
  );
}

/** Picks one of the GM's NPC sheets, how many come from it and on which side they fight. */
function AddNpc({
  onAdd,
  isBusy,
}: {
  onAdd: (characterId: string, count: number, side: NpcSide) => void;
  isBusy: boolean;
}) {
  const t = useTranslations('combat');
  const { characters: sheets } = useCharacters('npc');
  const [sheetId, setSheetId] = useState('');
  const [count, setCount] = useState(1);
  const [side, setSide] = useState<NpcSide>('enemy');

  if (sheets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t('noEnemySheets')}{' '}
        <Link href="/characters/npcs" className="text-primary-flare underline">
          {t('manageEnemySheets')}
        </Link>
      </p>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (sheetId) onAdd(sheetId, count, side);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-label text-muted-foreground">{t('enemySheet')}</span>
        <Select value={sheetId} onValueChange={setSheetId}>
          <SelectTrigger className="w-48" aria-label={t('enemySheet')}>
            <SelectValue placeholder={t('chooseEnemySheet')} />
          </SelectTrigger>
          <SelectContent>
            {sheets.map((sheet) => (
              <SelectItem key={sheet.id} value={sheet.id}>
                {sheet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-label text-muted-foreground">{t('count')}</span>
        {/* Keeps the typed text (clearing it doesn't snap back to 1); only a valid count is used */}
        <NumberInput
          min={1}
          max={MAX_ENEMIES_PER_ADD}
          value={count}
          onValueChange={setCount}
          className="w-20"
        />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-label text-muted-foreground">{t('side')}</span>
        <div role="group" aria-label={t('side')} className="flex">
          {NPC_SIDES.map((option) => (
            <Button
              key={option}
              type="button"
              variant="outline"
              aria-pressed={side === option}
              onClick={() => setSide(option)}
              className={cn(
                'first:rounded-r-none last:rounded-l-none last:border-l-0',
                side === option &&
                  'border-character-muted bg-character-surface text-character-flare',
              )}
            >
              {t(option)}
            </Button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={!sheetId} loading={isBusy}>
        {t(ADD_LABEL[side])}
      </Button>
      <Button asChild variant="ghost">
        <Link href="/characters/npcs">{t('manageEnemySheets')}</Link>
      </Button>
    </form>
  );
}

/**
 * The GM's combat mode: an initiative tracker with the party's characters and enemies from the
 * GM's npc sheets, the round and the current turn. Every change reaches the players live.
 */
export function GmCombatPanel({ party, live }: { party: PartyView; live: boolean }) {
  const t = useTranslations('combat');
  const combat = useEncounter(party.id);
  const encounter = combat.encounter?.role === 'gm' ? combat.encounter : null;
  // Larger screens: the open row's edits sit in a panel beside the list instead of inside it
  const sidePanel = useMediaQuery('(min-width: 1024px)') === true;
  const [picked, setPicked] = useState<string | null>(null);
  const [addingNpc, setAddingNpc] = useState(false);
  // Like an open row: the GM's pick holds until the turn moves, then the panel follows the turn
  const currentId = encounter?.rows.find((row) => row.isCurrent)?.participantId ?? null;
  const [turnSeen, setTurnSeen] = useState(currentId);
  if (turnSeen !== currentId) {
    setTurnSeen(currentId);
    setPicked(null);
  }

  if (!encounter) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground">{t('noCombat')}</p>
        <Button onClick={() => combat.create.mutate()} loading={combat.create.isPending}>
          {t('prepare')}
        </Button>
      </div>
    );
  }

  const { rows, round } = encounter;
  const ids = rows.map((row) => row.participantId);
  const inCombat = new Set(rows.map((row) => row.characterId));
  const missing = party.roster.filter((c) => !inCombat.has(c.characterId));
  const current = rows.find((row) => row.isCurrent);
  const selected = rows.find((row) => row.participantId === picked) ?? current ?? rows[0] ?? null;

  const swap = (a: string, b: string) =>
    combat.setOrder.mutate(ids.map((id) => (id === a ? b : id === b ? a : id)));
  const back = round > 0 ? previousPlayable(rows, round) : null;
  const next = round > 0 ? nextPlayable(rows) : null;
  const sorted = isSortedByInitiative(rows);

  const handlers = (row: GmRow, index: number) => ({
    onChange: (patch: ParticipantPatch) =>
      combat.updateParticipant.mutate({ participantId: row.participantId, ...patch }),
    swapWith: Object.values(tiedNeighbors(rows, index))
      .filter((neighbor) => neighbor !== undefined)
      .map(({ participantId, name }) => ({ participantId, name })),
    onSwap: (other: string) => swap(row.participantId, other),
    onConditionsChange: (conditions: ActiveCondition[]) =>
      combat.setConditions.mutate({ participantId: row.participantId, conditions }),
    onRemove: () => {
      if (window.confirm(t('removeConfirm', { name: row.name }))) {
        combat.removeParticipant.mutate(row.participantId);
      }
    },
  });

  const list = (
    <div className="flex min-w-0 flex-col gap-4">
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <ol aria-label={t('order')} className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <CombatRow
              key={row.participantId}
              partyId={party.id}
              row={row}
              waiting={round > 0 && !row.isCurrent}
              edition={party.edition}
              detailsInline={!sidePanel}
              selected={selected?.participantId === row.participantId}
              onSelect={() => setPicked(row.participantId)}
              {...handlers(row, index)}
            />
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {missing.length > 0 && (
          <Button
            variant="outline"
            loading={combat.addParticipant.isPending}
            onClick={() =>
              missing.forEach((c) => combat.addParticipant.mutate({ characterId: c.characterId }))
            }
          >
            {t('addPartyCharacters')}
          </Button>
        )}
        {rows.length > 1 && (
          // Lit up when the list is out of order, e.g. after a player typed their initiative
          <Button
            variant="outline"
            loading={combat.setOrder.isPending}
            onClick={() => combat.setOrder.mutate(sortByInitiative(rows))}
            className={cn(!sorted && 'border-warning-flare text-warning-flare')}
          >
            <AppIcon name="ArrowUpDown" size={16} aria-hidden="true" />
            {t('sortByInitiative')}
            {!sorted && <span>· {t('orderChanged')}</span>}
          </Button>
        )}
        {/* Adding an NPC is now and then: behind a button, so the list stays the screen */}
        <Button
          variant="outline"
          aria-expanded={addingNpc}
          aria-controls="combat-add-npc"
          onClick={() => setAddingNpc((open) => !open)}
        >
          <AppIcon name={addingNpc ? 'X' : 'Plus'} size={16} aria-hidden="true" />
          {t('addNpc')}
        </Button>
      </div>

      <div id="combat-add-npc" hidden={!addingNpc}>
        <AddNpc
          isBusy={combat.addParticipant.isPending}
          onAdd={(characterId, count, side) =>
            combat.addParticipant.mutate({ characterId, count, side })
          }
        />
      </div>

      <TurnBar>
        <p className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
          {round === 0
            ? t('preparing')
            : next
              ? t.rich('nextUp', {
                  name: next.name,
                  strong: (chunks) => (
                    <span className="text-foreground font-semibold">{chunks}</span>
                  ),
                })
              : null}
        </p>
        {round === 0 ? (
          <Button
            onClick={() => combat.start.mutate()}
            disabled={rows.length === 0}
            loading={combat.start.isPending}
          >
            {t('start')}
          </Button>
        ) : (
          current && (
            <>
              <Button
                variant="outline"
                disabled={!back}
                loading={combat.previousTurn.isPending}
                aria-label={t('previousTurn')}
                onClick={() => {
                  // The name is known now; after the refetch the list may have changed
                  const name = back?.name;
                  combat.previousTurn.mutate(undefined, {
                    onSuccess: () => {
                      if (name) toast(t('turnBackTo', { name }));
                    },
                  });
                }}
              >
                <AppIcon name="RotateCcw" size={16} aria-hidden="true" />
                <span className="max-sm:sr-only">{t('previousTurn')}</span>
              </Button>
              <Button
                onClick={() => {
                  // Same as going back: say whose turn it is now, read before the refetch
                  const name = next?.name;
                  combat.endTurn.mutate(current.participantId, {
                    onSuccess: () => {
                      if (name) toast(t('turnPassedTo', { name }));
                    },
                  });
                }}
                loading={combat.endTurn.isPending}
              >
                {t('endTurn')}
              </Button>
            </>
          )
        )}
      </TurnBar>
    </div>
  );

  return (
    // Phones: room under the list for the turn bar, above the tab bar
    <div className="flex flex-col gap-5 pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-heading">{round === 0 ? t('preparing') : t('round', { round })}</h2>
        <Button
          variant="ghost"
          className="text-danger-flare"
          loading={combat.finish.isPending}
          onClick={() => {
            if (window.confirm(t('endCombatConfirm'))) combat.finish.mutate();
          }}
        >
          {t('endCombat')}
        </Button>
      </div>

      <CombatConnection live={live} />

      {sidePanel && selected ? (
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-6">
          {list}
          <SelectedPanel
            key={selected.participantId}
            partyId={party.id}
            row={selected}
            edition={party.edition}
            {...handlers(selected, rows.indexOf(selected))}
          />
        </div>
      ) : (
        list
      )}
    </div>
  );
}
