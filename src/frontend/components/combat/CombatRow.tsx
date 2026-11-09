'use client';

import { type CSSProperties, useState } from 'react';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { Button } from '@frontend/components/ui/button';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { ActiveCondition, GmRow } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CollapsedDeadRow } from './CollapsedDeadRow';
import { CombatRowDetails } from './CombatRowDetails';
import { RowStatus } from './RowStatus';
import { OwnerOrSideBadge } from './SideBadge';
import { ZoomablePortrait } from './ZoomablePortrait';

/**
 * A participant in the GM's initiative tracker. Closed, it only reads; every edit lives in the
 * open part (`CombatRowDetails`). While someone else plays (`waiting`), it fades back.
 */
export function CombatRow({
  partyId,
  row,
  waiting = false,
  edition,
  swapWith,
  onSwap,
  onChange,
  onRemove,
  onConditionsChange,
}: {
  partyId: string;
  row: GmRow;
  waiting?: boolean;
  edition: Edition;
  swapWith: { participantId: string; name: string }[];
  onSwap: (participantId: string) => void;
  onChange: (patch: ParticipantPatch) => void;
  onRemove: () => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
}) {
  const t = useTranslations('combat');
  // An npc (enemy or ally) has its own HP in the combat and opens the GM's own sheet
  const isNpc = row.side !== 'player';
  const sheetHref = isNpc
    ? `/system/DnD_5e/character/${row.characterId}`
    : `/parties/${partyId}/characters/${row.characterId}`;
  const theme = characterTheme(row.accentColor);

  // The GM's choice holds until the turn comes or goes; then the row follows the turn again
  const [opened, setOpened] = useState<boolean | null>(null);
  const [turnSeen, setTurnSeen] = useState(row.isCurrent);
  if (turnSeen !== row.isCurrent) {
    setTurnSeen(row.isCurrent);
    setOpened(null);
  }
  const expanded = opened ?? row.isCurrent;
  const toggle = () => setOpened(!expanded);
  const detailsId = `combat-details-${row.participantId}`;
  const down = isNpc && row.hp.current === 0;
  // A death the players know of is a thin line, like in their list, until the GM opens it
  const collapsed = isNpc && row.fate === 'dead' && row.deathRevealed && opened !== true;

  if (collapsed) return <CollapsedDeadRow row={row} onExpand={() => setOpened(true)} />;

  return (
    <li
      aria-current={row.isCurrent ? 'true' : undefined}
      // A click on the closed part toggles (the chevron is the keyboard way); nothing in the open
      // part does, nor in its dialogs and selects, portals whose clicks still bubble here
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (!event.currentTarget.contains(target)) return;
        if (target.closest('[data-row-details], a, button, input')) return;
        toggle();
      }}
      // The turn's glow and border take the character's color too
      style={{ ...theme.style, '--primary': 'var(--character-color)' } as CSSProperties}
      className={cn(
        theme.className,
        'bg-card/60 border-character-muted relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border p-3 transition-[opacity,filter] duration-300',
        row.isCurrent && 'border-primary animate-turn-glow',
        // Faded, not disabled: back in full on hover, focus or when opened
        waiting &&
          !expanded &&
          'opacity-75 grayscale-[.7] focus-within:opacity-100 focus-within:grayscale-0 hover:opacity-100 hover:grayscale-0',
      )}
    >
      <div
        aria-hidden="true"
        className="bg-character absolute top-0 left-0 h-1 w-full opacity-80"
      />

      <div className="flex items-center gap-3">
        <span className="text-foreground w-7 shrink-0 text-center font-mono text-lg font-bold tabular-nums">
          <span className="sr-only">{t('initiative')} </span>
          {row.initiative ?? '—'}
        </span>

        <ZoomablePortrait
          src={row.avatarUrl}
          name={row.name}
          className={cn('size-11 sm:size-12', down && 'opacity-60 grayscale')}
        >
          <CharacterPortrait
            avatarUrl={row.avatarUrl}
            characterClass={row.class}
            className="size-full rounded-lg"
          />
        </ZoomablePortrait>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <AppLink
            href={sheetHref}
            className="text-title text-character-flare focus-ring max-w-full self-start truncate rounded-sm hover:underline"
          >
            {row.name}
          </AppLink>
          {/* On touch screens the gap keeps each condition badge's touch area apart */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pointer-coarse:gap-3">
            <OwnerOrSideBadge side={row.side} ownerUsername={row.ownerUsername} />
            <RowStatus row={row} />
            {row.isCurrent && (
              <span className="text-label text-character-flare bg-character-surface rounded-full px-2 py-0.5 whitespace-nowrap">
                {t('currentTurn')}
              </span>
            )}
            {row.conditions.map((condition) => (
              <ConditionBadge
                key={condition.key}
                conditionKey={condition.key}
                level={condition.level}
                defaultEdition={edition}
              />
            ))}
          </div>
        </div>

        <div className="flex w-20 shrink-0 flex-col items-end gap-1 sm:w-28">
          <span className="text-foreground font-mono text-sm font-bold tabular-nums">
            {`${row.hp.current} / ${row.hp.max}`}
            {row.hp.temp > 0 && <span className="text-warning"> +{row.hp.temp}</span>}
          </span>
          <HealthBar
            current={row.hp.current}
            max={row.hp.max}
            temp={row.hp.temp}
            aria-hidden="true"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={t('detailsOf', { name: row.name })}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={toggle}
          className="shrink-0"
        >
          <AppIcon
            name="ChevronRight"
            size={16}
            aria-hidden="true"
            className={cn('transition-transform duration-200', expanded && 'rotate-90')}
          />
        </Button>
      </div>

      {/* A player's death saves come from their sheet: read here, never edited */}
      {row.deathSaves && !isNpc && (
        <p className="text-caption text-danger-flare">{t('deathSaves', row.deathSaves)}</p>
      )}

      <CombatRowDetails
        id={detailsId}
        hidden={!expanded}
        row={row}
        sheetHref={sheetHref}
        edition={edition}
        swapWith={swapWith}
        onSwap={onSwap}
        onChange={onChange}
        onRemove={onRemove}
        onConditionsChange={onConditionsChange}
      />
    </li>
  );
}
