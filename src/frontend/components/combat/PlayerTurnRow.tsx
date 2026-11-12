'use client';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { ActiveCondition, TurnEntry } from '@backend/contexts/combat/domain/Encounter';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { ConditionsPicker } from './ConditionsPicker';
import { NumberCell } from './NumberCell';
import { SheetLink } from './SheetLink';
import { OwnerOrSideBadge, SideBadge } from './SideBadge';
import { ZoomablePortrait } from './ZoomablePortrait';

const UNKNOWN_KEY = {
  player: 'unknownEnemy', // players are never anonymous; the key only keeps the lookup total
  ally: 'unknownAlly',
  neutral: 'unknownNeutral',
  enemy: 'unknownEnemy',
} as const;

/** The picture of someone the player can't identify yet: a square "?" in the portrait's place. */
function UnknownMarker({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-muted border-border text-muted-foreground font-display flex shrink-0 items-center justify-center rounded-lg border',
        className,
      )}
    >
      ?
    </span>
  );
}

/**
 * One line of the player's turn order: side, name (or "unknown" while anonymous), picture and
 * conditions. Down fades to gray; dead is a thin, dashed line with the name struck through.
 */
export function PlayerTurnRow({
  turn,
  edition,
  onConditionsChange,
  onInitiativeChange,
}: {
  turn: TurnEntry;
  edition: Edition;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  onInitiativeChange: (initiative: number | null) => void;
}) {
  const t = useTranslations('combat');
  const tCond = useTranslations('conditions');
  const anonymous = turn.name === null;
  const name = turn.name ?? t(UNKNOWN_KEY[turn.side]);
  // An anonymous one's picture never shows, even if the NPC has one
  const avatarUrl = anonymous ? null : turn.avatarUrl;
  const dead = turn.life === 'dead';
  const down = turn.life === 'down';

  if (dead) {
    return (
      <li
        aria-current={turn.isCurrent ? 'true' : undefined}
        className={cn(
          'border-border text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-1',
          turn.isCurrent && 'border-primary',
        )}
      >
        {anonymous ? (
          <UnknownMarker className="size-5 text-xs" />
        ) : (
          <CharacterPortrait avatarUrl={avatarUrl} className="size-5 grayscale" />
        )}
        <s className="min-w-0 truncate text-sm">{name}</s>
        <SideBadge side={turn.side} className="ml-auto" />
        <AppIcon name="Skull" size={14} aria-hidden="true" />
        <span className="sr-only">{t('dead')}</span>
      </li>
    );
  }

  return (
    <li
      aria-current={turn.isCurrent ? 'true' : undefined}
      className={cn(
        'border-border flex flex-col gap-2 rounded-md border px-3 py-2',
        turn.isCurrent && 'border-primary bg-primary/10 animate-turn-glow',
      )}
    >
      <div className="flex items-center gap-3">
        <ZoomablePortrait src={avatarUrl} name={name} className="size-10">
          <div className={cn('size-full', down && 'opacity-60 grayscale')}>
            {anonymous ? (
              <UnknownMarker className="size-10 text-lg" />
            ) : (
              <CharacterPortrait avatarUrl={avatarUrl} className="size-10" />
            )}
          </div>
        </ZoomablePortrait>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              'truncate',
              turn.isMine && 'font-semibold',
              down && 'text-muted-foreground',
            )}
          >
            {name}
          </span>
          <OwnerOrSideBadge side={turn.side} ownerUsername={turn.ownerUsername} />
        </div>
        {down && <span className="text-label">{t('down')}</span>}
        {turn.isCurrent && (
          <span className="text-label text-primary-flare">
            {turn.isMine ? t('yourTurn') : t('currentTurn')}
          </span>
        )}
      </div>
      {turn.isMine && (
        <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-3">
          <label className="text-label flex items-center gap-2">
            {t('yourInitiative')}
            <NumberCell
              label={t('yourInitiative')}
              value={turn.initiative}
              min={-10}
              max={99}
              nullable
              placeholder="—"
              onCommit={onInitiativeChange}
            />
          </label>
          {turn.characterId && (
            <SheetLink href={`/system/DnD_5e/character/${turn.characterId}`} name={name} />
          )}
        </div>
      )}
      {(turn.conditions.length > 0 || turn.isMine) && (
        // On touch screens the gap keeps each badge's touch area apart
        <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-3">
          {turn.conditions.map((condition) => (
            <ConditionBadge
              key={condition.key}
              conditionKey={condition.key}
              level={condition.level}
              defaultEdition={edition}
            />
          ))}
          {turn.isMine && (
            <ConditionsPicker
              value={turn.conditions}
              defaultEdition={edition}
              onChange={onConditionsChange}
            >
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('conditionsOf', { name })}
                className="touch-target"
              >
                <AppIcon name="Activity" size={16} aria-hidden="true" />
                {tCond('title')}
              </Button>
            </ConditionsPicker>
          )}
        </div>
      )}
    </li>
  );
}
