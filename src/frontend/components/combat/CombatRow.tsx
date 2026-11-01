'use client';

import { type CSSProperties, useState } from 'react';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { CharacterIdentity } from '@frontend/components/party/RolePlayCard';
import { Button } from '@frontend/components/ui/button';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { StatBlock } from '@frontend/components/ui/stat-block';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import type { ActiveCondition, GmRow } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

import { getModifier } from '@shared/systems/dnd5e/calculations';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { ConditionsPicker } from './ConditionsPicker';

/** A number field saved when it loses focus; empty means "none" where `nullable`. */
function NumberCell({
  label,
  value,
  min,
  max,
  nullable = false,
  placeholder,
  onCommit,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  nullable?: boolean;
  placeholder?: string;
  onCommit: (value: number | null) => void;
}) {
  return (
    <Input
      // A new value from the server (another device, a clamp) resets the field
      key={value ?? ''}
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      defaultValue={value ?? ''}
      placeholder={placeholder}
      onBlur={(event) => {
        const text = event.currentTarget.value.trim();
        const next = text === '' ? null : Math.round(Number(text));
        if (next === value || (next === null && !nullable) || Number.isNaN(next)) return;
        onCommit(next === null ? null : Math.min(max, Math.max(min, next)));
      }}
      // 44px tall where it's tapped, like the buttons' touch area
      className="h-9 w-16 px-2 text-center font-mono tabular-nums pointer-coarse:h-11"
    />
  );
}

const ATTRIBUTES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

/** The character's picture down the card's left side; their class's emblem when there's none. */
function Portrait({ row }: { row: GmRow }) {
  return (
    <CharacterPortrait
      avatarUrl={row.avatarUrl}
      characterClass={row.class}
      className="h-auto w-14 self-stretch rounded-none sm:w-28"
    />
  );
}

/**
 * A participant in the GM's initiative tracker, drawn like the character card on the home page.
 * Closed: initiative, who it is (opens the sheet) and HP. Opened, by a click or because it's
 * their turn: AC, passive perception, speed, an enemy's temp HP and the attribute modifiers. Only
 * enemies' HP is edited here; a player's comes from their sheet, and their death saves show at 0.
 * While someone else plays (`waiting`), the card fades back so the turn stands out.
 */
export function CombatRow({
  partyId,
  row,
  isFirst,
  isLast,
  waiting = false,
  onChange,
  onMove,
  onRemove,
  edition,
  onConditionsChange,
}: {
  partyId: string;
  row: GmRow;
  isFirst: boolean;
  isLast: boolean;
  waiting?: boolean;
  onChange: (patch: ParticipantPatch) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  /** The party's edition: the picker opens on it, and badges of the other one say so. */
  edition: Edition;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
}) {
  const t = useTranslations('combat');
  const tStats = useTranslations('combatStats');
  const tCond = useTranslations('conditions');
  const tAttr = useTranslations('attributes.abbreviations');
  // An npc (enemy or ally) has its own HP in the combat and opens the GM's own sheet
  const isNpc = row.side !== 'player';
  const sheetHref = isNpc
    ? `/system/DnD_5e/character/${row.characterId}`
    : `/parties/${partyId}/characters/${row.characterId}`;
  const theme = characterTheme(row.accentColor);

  // The GM's choice holds until the turn comes or goes; then the card follows the turn again
  const [opened, setOpened] = useState<boolean | null>(null);
  const [turnSeen, setTurnSeen] = useState(row.isCurrent);
  if (turnSeen !== row.isCurrent) {
    setTurnSeen(row.isCurrent);
    setOpened(null);
  }
  const expanded = opened ?? row.isCurrent;
  const toggle = () => setOpened(!expanded);
  const detailsId = `combat-details-${row.participantId}`;
  const status = row.isCurrent ? t('currentTurn') : row.side === 'player' ? null : t(row.side);

  return (
    <li
      aria-current={row.isCurrent ? 'true' : undefined}
      // A click anywhere but on a field, link or button opens it; the chevron is the keyboard way
      onClick={(event) => {
        // The picker's dialog is a portal, but its clicks still bubble to the card
        if (!event.currentTarget.contains(event.target as Node)) return;
        if (!(event.target as HTMLElement).closest('a, button, input')) toggle();
      }}
      // The turn's glow and border take the character's color too
      style={{ ...theme.style, '--primary': 'var(--character-color)' } as CSSProperties}
      className={cn(
        theme.className,
        'bg-card/60 border-character-muted relative flex cursor-pointer overflow-hidden rounded-xl border transition-[opacity,filter] duration-300',
        row.isCurrent && 'border-primary animate-turn-glow',
        // Faded, not disabled: back in full on hover, focus or when opened
        waiting &&
          !expanded &&
          'opacity-75 grayscale-[.7] focus-within:opacity-100 focus-within:grayscale-0 hover:opacity-100 hover:grayscale-0',
      )}
    >
      <div
        aria-hidden="true"
        className="bg-character absolute top-0 left-0 z-10 h-1 w-full opacity-80"
      />

      <Portrait row={row} />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <NumberCell
            label={t('initiativeOf', { name: row.name })}
            value={row.initiative}
            min={-10}
            max={99}
            nullable
            placeholder="—"
            onCommit={(initiative) => onChange({ initiative })}
          />

          {/* Never squeezed out by the buttons: on a phone they drop to the next line */}
          <div className="min-w-0 flex-1 basis-40">
            <CharacterIdentity character={row} href={sheetHref} withAvatar={false} />
          </div>

          {/* Its own item, so on a phone the buttons can drop below it */}
          {status && (
            <span className="text-label text-character-flare bg-character-surface ml-auto rounded-full px-2 py-0.5 whitespace-nowrap">
              {status}
            </span>
          )}

          {/* On touch screens the gap keeps each button's 44px touch area apart */}
          <div className="ml-auto flex items-center gap-1 pointer-coarse:gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('moveUp', { name: row.name })}
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              <AppIcon name="ChevronUp" size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('moveDown', { name: row.name })}
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              <AppIcon name="ChevronDown" size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('remove', { name: row.name })}
              onClick={onRemove}
              className="text-danger-flare"
            >
              <AppIcon name="X" size={16} aria-hidden="true" />
            </Button>
            {/* Keeps the details chevron apart from the move-down one */}
            <span aria-hidden="true" className="bg-border mx-1 h-5 w-px" />
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('detailsOf', { name: row.name })}
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={toggle}
            >
              <AppIcon
                name="ChevronRight"
                size={16}
                aria-hidden="true"
                className={cn('transition-transform duration-200', expanded && 'rotate-90')}
              />
            </Button>
          </div>
        </div>

        {/* On touch screens the gap keeps each badge's touch area apart */}
        <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-3">
          {row.conditions.map((condition) => (
            <ConditionBadge
              key={condition.key}
              conditionKey={condition.key}
              level={condition.level}
              defaultEdition={edition}
            />
          ))}
          <ConditionsPicker
            value={row.conditions}
            defaultEdition={edition}
            onChange={onConditionsChange}
          >
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('conditionsOf', { name: row.name })}
              className="touch-target"
            >
              <AppIcon name="Activity" size={16} aria-hidden="true" />
              {tCond('title')}
            </Button>
          </ConditionsPicker>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label text-danger-flare">{tStats('hitPointsShort')}</span>
            {isNpc ? (
              <span className="flex items-center gap-1">
                <NumberCell
                  label={t('hpOf', { name: row.name })}
                  value={row.hp.current}
                  min={0}
                  max={row.hp.max}
                  onCommit={(hpCurrent) => onChange({ hpCurrent: hpCurrent ?? 0 })}
                />
                <span className="text-muted-foreground font-mono text-sm font-bold">
                  / {row.hp.max}
                </span>
              </span>
            ) : (
              <span className="text-foreground font-mono text-sm font-bold tabular-nums">
                {`${row.hp.current} / ${row.hp.max}`}
                {row.hp.temp > 0 && <span className="text-warning"> +{row.hp.temp}</span>}
              </span>
            )}
          </div>
          <HealthBar
            current={row.hp.current}
            max={row.hp.max}
            temp={row.hp.temp}
            aria-hidden="true"
          />
          {row.deathSaves && (
            <p className="text-caption text-danger-flare">{t('deathSaves', row.deathSaves)}</p>
          )}
        </div>

        <div id={detailsId} hidden={!expanded} className="animate-fade-in flex flex-col gap-2">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
            <StatBlock icon="shoulder-armor" label={tStats('armorClass')}>
              {row.ac}
            </StatBlock>
            <StatBlock icon="Eye" iconVariant="system" label={t('passivePerception')}>
              {row.passivePerception}
            </StatBlock>
            <StatBlock icon="boot-prints" label={tStats('speed')} unit={tStats('speedUnit')}>
              {row.speed}
            </StatBlock>
            {isNpc && (
              <StatBlock icon="Shield" iconVariant="system" label={t('tempHp')}>
                <NumberCell
                  label={t('tempHpOf', { name: row.name })}
                  value={row.hp.temp}
                  min={0}
                  max={9999}
                  onCommit={(hpTemp) => onChange({ hpTemp: hpTemp ?? 0 })}
                />
              </StatBlock>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ATTRIBUTES.map((key) => {
              const mod = getModifier(row.attributes[key] ?? 10);
              return (
                <div
                  key={key}
                  className="border-border bg-background/60 flex flex-col items-center rounded-lg border py-2"
                >
                  <dt className="text-label text-muted-foreground">{tAttr(key)}</dt>
                  <dd
                    className={cn(
                      'font-mono text-lg font-bold tabular-nums',
                      getStatColorClass(mod),
                    )}
                  >
                    {mod >= 0 ? `+${mod}` : mod}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </li>
  );
}
