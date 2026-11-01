'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { cn } from '@frontend/lib/utils';

import type { GmRow } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

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

/** Above half, under half, a quarter or less: the GM sees who's falling without reading numbers. */
function HpBar({ current, max }: { current: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const tone = percent > 50 ? 'healthy' : percent > 25 ? 'wounded' : 'critical';

  return (
    <div
      data-hp-bar
      data-tone={tone}
      // The numbers next to it already say this
      aria-hidden="true"
      className="bg-muted h-1 w-full overflow-hidden rounded-full"
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'healthy' && 'bg-success',
          tone === 'wounded' && 'bg-warning',
          tone === 'critical' && 'bg-danger',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * A participant in the GM's initiative tracker: initiative, name (opens the sheet), HP, AC,
 * passive perception and magic. Only enemies' HP is edited here; a player's comes from their
 * sheet, and their death saves show at 0.
 */
export function CombatRow({
  partyId,
  row,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: {
  partyId: string;
  row: GmRow;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: ParticipantPatch) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('combat');
  const isEnemy = row.side === 'enemy';
  const hasMagic = row.spellSlots.length > 0 || row.spellPoints !== null;
  const sheetHref = isEnemy
    ? `/system/DnD_5e/character/${row.characterId}`
    : `/parties/${partyId}/characters/${row.characterId}`;

  return (
    <li
      aria-current={row.isCurrent ? 'true' : undefined}
      className={cn(
        'bg-card/60 border-border flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border p-3',
        row.isCurrent && 'border-primary bg-primary/10 animate-turn-glow',
      )}
    >
      <NumberCell
        label={t('initiativeOf', { name: row.name })}
        value={row.initiative}
        min={-10}
        max={99}
        nullable
        placeholder="—"
        onCommit={(initiative) => onChange({ initiative })}
      />

      <div className="flex min-w-32 flex-1 flex-col">
        <Link
          href={sheetHref}
          className="text-title focus-ring truncate rounded-sm hover:underline"
        >
          {row.name}
        </Link>
        <span className="text-label text-muted-foreground">
          {row.isCurrent ? t('currentTurn') : isEnemy ? t('enemy') : ' '}
        </span>
      </div>

      {/* As wide as an enemy's fields, so a full bar is just as long on every row */}
      <div className="flex min-w-52 flex-col gap-1">
        <span className="text-label text-muted-foreground">{t('hp')}</span>
        {isEnemy ? (
          <div className="flex items-center gap-1">
            <NumberCell
              label={t('hpOf', { name: row.name })}
              value={row.hp.current}
              min={0}
              max={row.hp.max}
              onCommit={(hpCurrent) => onChange({ hpCurrent: hpCurrent ?? 0 })}
            />
            <span className="text-muted-foreground font-mono text-sm">/{row.hp.max}</span>
            {/* The field is named for screen readers; the word is for the eye */}
            <span aria-hidden="true" className="text-caption text-muted-foreground ml-1">
              {t('tempHp')}
            </span>
            <NumberCell
              label={t('tempHpOf', { name: row.name })}
              value={row.hp.temp}
              min={0}
              max={9999}
              onCommit={(hpTemp) => onChange({ hpTemp: hpTemp ?? 0 })}
            />
          </div>
        ) : (
          <span className="font-mono tabular-nums">
            {`${row.hp.current}/${row.hp.max}`}
            {row.hp.temp > 0 && <span className="text-info-flare"> +{row.hp.temp}</span>}
          </span>
        )}
        <HpBar current={row.hp.current} max={row.hp.max} />
        {row.deathSaves && (
          <span className="text-caption text-danger-flare">{t('deathSaves', row.deathSaves)}</span>
        )}
      </div>

      <dl className="flex gap-4">
        <div className="flex flex-col">
          <dt className="text-label text-muted-foreground">{t('ac')}</dt>
          <dd className="font-mono tabular-nums">{row.ac}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-label text-muted-foreground">{t('passivePerception')}</dt>
          <dd className="font-mono tabular-nums">{row.passivePerception}</dd>
        </div>
        {hasMagic && (
          <div className="flex flex-col">
            <dt className="text-label text-muted-foreground">{t('spells')}</dt>
            <dd className="font-mono text-sm tabular-nums">
              {row.spellPoints
                ? t('spellPoints', row.spellPoints)
                : row.spellSlots
                    .map((slot) =>
                      t('slot', {
                        level: slot.level,
                        available: Math.max(0, slot.max - slot.used),
                        max: slot.max,
                      }),
                    )
                    .join(' · ')}
            </dd>
          </div>
        )}
      </dl>

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
      </div>
    </li>
  );
}
