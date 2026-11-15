'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@frontend/lib/utils';

interface UsePipsProps {
  /** Resource name, e.g. "Ki"; goes into each button's accessible name. */
  label: string;
  /** null means unlimited: shows the text and no buttons. */
  max: number | null;
  used: number;
  onChange: (used: number) => void | Promise<void>;
  /** Read-only sheets. */
  disabled?: boolean;
  /** Forces the number form (used by the hit points unit). */
  asNumber?: boolean;
  className?: string;
  /** Marks the control the rest checklist's "go" button focuses. */
  'data-rest-focus'?: boolean;
}

/** Above this many uses, squares stop fitting and a number with − / + takes over. */
const MAX_PIPS = 20;

export function UsePips({
  label,
  max,
  used,
  onChange,
  disabled,
  asNumber,
  className,
  'data-rest-focus': restFocus,
}: UsePipsProps) {
  const t = useTranslations('usePips');
  const [pending, setPending] = React.useState(false);

  if (max === null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>{t('unlimited')}</span>;
  }

  const spentCount = Math.min(Math.max(used, 0), max);
  const availableCount = max - spentCount;
  const locked = disabled || pending;

  // Disables every button while the save is in flight, and re-enables when it settles
  // (even on rejection) so a failed save never leaves the control stuck
  const change = async (next: number) => {
    if (locked) return;
    const bounded = Math.min(Math.max(next, 0), max);
    setPending(true);
    try {
      await onChange(bounded);
    } catch {
      // The caller owns error reporting; here a failure only has to unlock the control
    } finally {
      setPending(false);
    }
  };

  const summary = t('summary', { label, available: availableCount, max });

  if (asNumber || max > MAX_PIPS) {
    const buttonClass =
      'focus-ring border-character-muted text-character-flare flex size-6 items-center justify-center rounded-sm border disabled:opacity-40 pointer-coarse:size-11';
    return (
      <div
        role="group"
        aria-label={summary}
        data-rest-focus={restFocus || undefined}
        className={cn('flex items-center gap-2', className)}
      >
        <button
          type="button"
          aria-label={t('spendOne', { label })}
          disabled={locked || availableCount <= 0}
          onClick={() => change(spentCount + 1)}
          className={buttonClass}
        >
          <span aria-hidden="true">−</span>
        </button>
        <span className="text-character-flare font-mono text-sm font-bold tabular-nums">
          {availableCount} / {max}
        </span>
        <button
          type="button"
          aria-label={t('returnOne', { label })}
          disabled={locked || spentCount <= 0}
          onClick={() => change(spentCount - 1)}
          className={buttonClass}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={summary}
      data-rest-focus={restFocus || undefined}
      className={cn('flex flex-wrap', className)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const isAvailable = i < availableCount;
        return (
          <button
            key={i}
            type="button"
            // State lives in the name, like SpellSlots: an available square spends one,
            // a spent one returns one
            aria-label={t(isAvailable ? 'available' : 'spent', { label, slot: i + 1 })}
            disabled={locked}
            onClick={() => change(isAvailable ? spentCount + 1 : spentCount - 1)}
            className="focus-ring flex size-6 items-center justify-center rounded-sm pointer-coarse:size-11"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-2.5 rounded-[1px] transition-[background-color,border-color,box-shadow] duration-300 pointer-coarse:size-3.5',
                isAvailable
                  ? 'bg-character-flare shadow-[0_0_8px_var(--character-muted)]'
                  : 'border-character-muted border bg-transparent',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
