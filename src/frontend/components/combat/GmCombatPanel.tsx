'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { useCharacters } from '@frontend/hooks/useCharacters';
import { useEncounter } from '@frontend/hooks/useEncounter';
import {
  isSortedByInitiative,
  sortByInitiative,
  tiedNeighbors,
} from '@frontend/lib/initiative-order';
import { cn } from '@frontend/lib/utils';

import {
  type GmRow,
  MAX_ENEMIES_PER_ADD,
  type NpcSide,
} from '@backend/contexts/combat/domain/Encounter';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { CombatConnection } from './CombatConnection';
import { CombatRow } from './CombatRow';

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
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_ENEMIES_PER_ADD}
          value={count}
          onChange={(event) =>
            setCount(Math.min(MAX_ENEMIES_PER_ADD, Math.max(1, Number(event.target.value) || 1)))
          }
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

  const swap = (a: string, b: string) =>
    combat.setOrder.mutate(ids.map((id) => (id === a ? b : id === b ? a : id)));
  const back = round > 0 ? previousPlayable(rows, round) : null;
  const sorted = isSortedByInitiative(rows);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-heading">{round === 0 ? t('preparing') : t('round', { round })}</h2>
        <div className="flex flex-wrap gap-2">
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
                  {t('previousTurn')}
                </Button>
                <Button
                  onClick={() => combat.endTurn.mutate(current.participantId)}
                  loading={combat.endTurn.isPending}
                >
                  {t('endTurn')}
                </Button>
              </>
            )
          )}
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
      </div>

      <CombatConnection live={live} />

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
              onChange={(patch) =>
                combat.updateParticipant.mutate({ participantId: row.participantId, ...patch })
              }
              swapWith={Object.values(tiedNeighbors(rows, index))
                .filter((neighbor) => neighbor !== undefined)
                .map(({ participantId, name }) => ({ participantId, name }))}
              onSwap={(other) => swap(row.participantId, other)}
              edition={party.edition}
              onConditionsChange={(conditions) =>
                combat.setConditions.mutate({ participantId: row.participantId, conditions })
              }
              onRemove={() => {
                if (window.confirm(t('removeConfirm', { name: row.name }))) {
                  combat.removeParticipant.mutate(row.participantId);
                }
              }}
            />
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-end gap-4">
        {missing.length > 0 && (
          <Button
            variant="outline"
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
            onClick={() => combat.setOrder.mutate(sortByInitiative(rows))}
            className={cn(!sorted && 'border-warning-flare text-warning-flare')}
          >
            <AppIcon name="ArrowUpDown" size={16} aria-hidden="true" />
            {t('sortByInitiative')}
            {!sorted && <span>· {t('orderChanged')}</span>}
          </Button>
        )}
      </div>

      <AddNpc
        isBusy={combat.addParticipant.isPending}
        onAdd={(characterId, count, side) =>
          combat.addParticipant.mutate({ characterId, count, side })
        }
      />
    </div>
  );
}
