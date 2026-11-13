'use client';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { SheetPreview } from '@frontend/components/character/sheet/SheetPreview';
import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { StatBlock } from '@frontend/components/ui/stat-block';
import { cn } from '@frontend/lib/utils';

import type { ActiveCondition, TurnEntry } from '@backend/contexts/combat/domain/Encounter';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { ConditionsPicker } from './ConditionsPicker';
import { NumberCell } from './NumberCell';
import { AdjustOwnHitPoints, OwnHp } from './OwnHitPoints';
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
 * The player's own rows also show their HP and "Adjust HP"; on their turn the row becomes a
 * card with HP, AC and speed too.
 */
export function PlayerTurnRow({
  partyId,
  turn,
  edition,
  onConditionsChange,
  onInitiativeChange,
}: {
  partyId: string;
  turn: TurnEntry;
  edition: Edition;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  onInitiativeChange: (initiative: number | null) => void;
}) {
  const t = useTranslations('combat');
  const tCond = useTranslations('conditions');
  const tStats = useTranslations('combatStats');
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

  const vitals = turn.isMine ? turn.vitals : null;
  // Their own turn: the row grows into a card with what they need to play it
  const card = !!vitals && turn.isCurrent;
  const portraitSize = card ? 'size-12 sm:size-14' : 'size-10';
  const adjust = vitals && turn.characterId && (
    <AdjustOwnHitPoints
      partyId={partyId}
      characterId={turn.characterId}
      name={name}
      hp={vitals.hp}
      compact={!card}
    />
  );

  return (
    <li
      aria-current={turn.isCurrent ? 'true' : undefined}
      className={cn(
        'border-border flex flex-col gap-2 rounded-md border px-3 py-2',
        turn.isCurrent && 'border-primary bg-primary/10 animate-turn-glow',
        card && 'gap-3 rounded-xl p-3 sm:p-4',
      )}
    >
      <div className="flex items-center gap-3">
        <ZoomablePortrait src={avatarUrl} name={name} className={portraitSize}>
          <div className={cn('size-full', down && 'opacity-60 grayscale')}>
            {anonymous ? (
              <UnknownMarker className="size-10 text-lg" />
            ) : (
              <CharacterPortrait avatarUrl={avatarUrl} className={portraitSize} />
            )}
          </div>
        </ZoomablePortrait>
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              'truncate',
              turn.isMine && 'font-semibold',
              card && 'text-title',
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
        {/* Their own HP beside the name, as on the GM's row; the card shows it larger below */}
        {vitals && !card && <OwnHp hp={vitals.hp} className="w-16 shrink-0 sm:w-28" />}
      </div>
      {vitals && card && (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <OwnHp hp={vitals.hp} size="lg" className="flex-1" />
            {adjust}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StatBlock icon="shoulder-armor" label={tStats('armorClass')}>
              {vitals.ac}
            </StatBlock>
            <StatBlock icon="boot-prints" label={tStats('speed')} unit={tStats('speedUnit')}>
              {vitals.speed}
            </StatBlock>
          </div>
        </div>
      )}
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
          {!card && adjust}
          {turn.characterId && (
            <SheetPreview
              characterId={turn.characterId}
              name={name}
              source={{ kind: 'own' }}
              canEdit
            />
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
