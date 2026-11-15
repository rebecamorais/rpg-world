'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import {
  useCharacterActions,
  useCharacterState,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { MERGED_BY_KEY } from '@frontend/lib/character-changes';
import { characterTheme } from '@frontend/lib/color-utils';
import { type RestItem, buildRestChecklist } from '@frontend/lib/rest-checklist';
import { restRecovery } from '@frontend/lib/rest-recovery';
import { cn } from '@frontend/lib/utils';

import { getModifier } from '@shared/systems/dnd5e/calculations';
import { hitDiceRemaining, hitDieSides } from '@shared/systems/dnd5e/hit-dice';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { useResourceBoxes } from '../resources/useResourceBoxes';
import { useSaveBarSlot } from '../sheet/SaveControls';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Layers Esc belongs to: a dialog, or a popover/select/menu floating over the sheet. */
const OTHER_LAYER = '[role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]';

/** What the long rest gives back to the sheet's magic, if it tracks any (points is the default). */
function magicToRestore(character: DnD5eCharacter): 'slots' | 'points' | null {
  if (character.spellcastingSystem === 'slots') {
    const slots = Object.values(character.spellSlots ?? {});
    return slots.some((slot) => slot.max > 0) ? 'slots' : null;
  }
  return (character.spellPoints?.max ?? 0) > 0 ? 'points' : null;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What Undo of "Recover" saves, read on the server copy now: `before` back only where the sheet
 * still holds what the recovery set (key by key in the merged maps). A hit taken or a box spent
 * after recovering is play, not part of the rest, and stays.
 */
function undoRecovery(
  server: DnD5eCharacter,
  before: Partial<DnD5eCharacter>,
  applied: Partial<DnD5eCharacter>,
): Partial<DnD5eCharacter> {
  const now = server as unknown as Record<string, unknown>;
  const was = before as Record<string, unknown>;
  const undo: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(applied)) {
    if ((MERGED_BY_KEY as readonly string[]).includes(key) && value && typeof value === 'object') {
      const current = (now[key] ?? {}) as Record<string, unknown>;
      const previous = (was[key] ?? {}) as Record<string, unknown>;
      const entries = Object.entries(value).filter(
        ([entry, set]) => entry in previous && same(current[entry], set),
      );
      if (entries.length > 0) {
        undo[key] = { ...current, ...Object.fromEntries(entries.map(([e]) => [e, previous[e]])) };
      }
    } else if (same(now[key], value)) {
      undo[key] = was[key];
    }
  }
  return undo as Partial<DnD5eCharacter>;
}

/**
 * Where "go" puts the focus: the block's `data-rest-focus` control (the field to change, not the
 * gear or the edit link that may come first), else the block's first focusable.
 */
function focusTarget(block: HTMLElement) {
  const marked = block.querySelector<HTMLElement>('[data-rest-focus]');
  if (marked?.matches(FOCUSABLE)) return marked;
  return (
    marked?.querySelector<HTMLElement>(FOCUSABLE) ?? block.querySelector<HTMLElement>(FOCUSABLE)
  );
}

/**
 * What to update on the sheet after a rest. "Recover" gives back, in one save with an Undo, what
 * comes back by itself (HP, hit dice, slots, boxes) and ticks those items; the rest (spending hit
 * dice) is for the player, and ticks live only here. Not modal and no focus trap, so the sheet
 * stays editable. On a phone it is a bar above the tab bar.
 */
export function RestChecklist({ rest, onClose }: { rest: 'short' | 'long'; onClose: () => void }) {
  const t = useTranslations('restChecklist');
  const character = useLoadedCharacter();
  const { boxes, content } = useResourceBoxes();
  const { isDirty } = useCharacterState();
  const { saveNow } = useCharacterActions();
  const slot = useSaveBarSlot();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  // Phone only: collapsed, the list hides and the bar is one button tall. It starts and goes
  // collapsed while the save bar shows: stacked open, the two took ~70% of a 390px screen and
  // covered the VitalsBar. When the save bar goes away the list opens again, unless the player
  // collapsed or opened it themselves meanwhile
  const [collapsed, setCollapsed] = useState(isDirty);
  const [autoCollapsed, setAutoCollapsed] = useState(isDirty);
  const [dirtySeen, setDirtySeen] = useState(isDirty);
  if (dirtySeen !== isDirty) {
    setDirtySeen(isDirty);
    if (isDirty && !collapsed) {
      setCollapsed(true);
      setAutoCollapsed(true);
    } else if (!isDirty && autoCollapsed) {
      setCollapsed(false);
      setAutoCollapsed(false);
    }
  }
  const [recovering, setRecovering] = useState(false);
  const [recovered, setRecovered] = useState(false);

  const level = character.level;
  const items = buildRestChecklist({
    rest,
    level,
    // The sheet's own die first: the player may have set one other than the class's
    hitDie: hitDieSides(character.hitDice) ?? content?.hitDie ?? null,
    conMod: getModifier(character.attributes.CON ?? 10),
    hitDiceAvailable: hitDiceRemaining(character.hitDice, level),
    boxes,
    magic: magicToRestore(character),
    hasPactSlots: !!content?.resources.some((r) => r.unit === 'spell-slots' && r.level <= level),
    hasTempHp: (character.hpTemp ?? 0) > 0,
  });

  // Opening moves the focus here, so the list is what the keyboard reads next. No trap: Tab
  // leaves for the sheet freely
  useEffect(() => heading.current?.focus(), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // A popover, select or dialog on the sheet closing on this Esc: Radix marks it handled
      if (event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest(OTHER_LAYER)) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const toggle = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const go = (target: RestItem['target']) => {
    const element = target ? document.getElementById(target) : null;
    element?.scrollIntoView({ block: 'center' });
    if (element) focusTarget(element)?.focus({ preventScroll: true });
    setCollapsed(true);
    setAutoCollapsed(false);
  };

  const text = (item: RestItem) => {
    const values = item.values && {
      ...item.values,
      ...('amount' in item.values ? { amount: String(item.values.amount) } : {}),
    };
    return t(item.message, values);
  };

  const title = rest === 'short' ? t('shortTitle') : t('longTitle');
  const recoverable = restRecovery(rest, character, boxes);

  const recover = async () => {
    const { items: done } = recoverable;
    // What Undo puts back, taken from the server copy (not the draft: a pending edit in one of
    // these fields was never saved, so Undo must not save it), and what the recovery set
    let before: Partial<DnD5eCharacter> = {};
    let applied: Partial<DnD5eCharacter> = {};
    setRecovering(true);
    try {
      // Read on the server copy, like every tap during play: a pending sheet edit stays pending
      await saveNow((server) => {
        applied = restRecovery(rest, server, boxes).fields;
        before = Object.fromEntries(
          Object.keys(applied).map((key) => [key, server[key as keyof DnD5eCharacter]]),
        ) as Partial<DnD5eCharacter>;
        return applied;
      });
    } catch {
      // saveNow already showed the error, with "Try again"
      return;
    } finally {
      setRecovering(false);
    }
    setRecovered(true);
    setTicked((current) => new Set([...current, ...done]));
    toast.success(t('recovered', { title }), {
      action: {
        label: t('undo'),
        onClick: () =>
          saveNow((server) => undoRecovery(server, before, applied))
            .then(() => {
              setRecovered(false);
              setTicked((current) => new Set([...current].filter((id) => !done.includes(id))));
            })
            .catch(() => {}),
      },
    });
  };

  const progress = t('progress', { title, done: ticked.size, total: items.length });
  const theme = characterTheme(character.accentColor);

  // In the sheet, the list joins the save bars' column (under them), so the bar that shows up once
  // a tick leads to an edit never covers it. Elsewhere it goes to the body: a transformed ancestor
  // in the page frame would turn `fixed` into relative
  return createPortal(
    <aside
      aria-labelledby={titleId}
      // Out of the sheet's `.character-context`, so it brings the character's color along
      className={cn(
        theme.className,
        'border-border bg-card/95 flex flex-col shadow-lg backdrop-blur-md',
        slot
          ? // Below lg the sticky VitalsBar (~9rem) holds the top: the list stops short of it,
            // and of the save bar above it when there is one
            cn(
              'order-last rounded-lg border sm:w-80 sm:self-end',
              isDirty
                ? 'max-h-[min(60dvh,calc(100dvh_-_9rem_-_env(safe-area-inset-bottom)_-_9rem))] md:max-h-[min(70dvh,calc(100dvh_-_5.5rem_-_9rem))] lg:max-h-[calc(70dvh_-_4.5rem)]'
                : 'max-h-[min(60dvh,calc(100dvh_-_4.5rem_-_env(safe-area-inset-bottom)_-_9rem))] md:max-h-[min(70dvh,calc(100dvh_-_1rem_-_9rem))] lg:max-h-[70dvh]',
            )
          : // From sm the side menu is open: start to its right, as the tab bar does
            'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 max-h-[min(60dvh,calc(100dvh_-_3.5rem_-_env(safe-area-inset-bottom)_-_9rem))] border-t sm:left-(--sidebar-offset) md:inset-x-auto md:right-4 md:bottom-4 md:max-h-[min(70dvh,calc(100dvh_-_1rem_-_9rem))] md:w-80 md:rounded-lg md:border lg:max-h-[70dvh]',
      )}
      style={theme.style}
    >
      <div className="flex items-center justify-between gap-2 px-3">
        <h2
          ref={heading}
          tabIndex={-1}
          className="min-w-0 flex-1 text-sm font-semibold outline-none"
        >
          {/* Phone: the title expands and collapses the list. md+: the list is always open */}
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed((value) => !value);
              setAutoCollapsed(false);
            }}
            className="focus-ring min-h-11 w-full truncate text-left md:hidden"
          >
            {progress}
          </button>
          <span id={titleId} className="hidden min-h-11 truncate leading-[2.75rem] md:block">
            {progress}
          </span>
        </h2>
        <Button size="sm" onClick={onClose}>
          {t('done')}
        </Button>
      </div>
      {recoverable.items.length > 0 && (
        <div
          className={cn('flex items-center gap-3 px-3 pb-2', collapsed ? 'hidden md:flex' : 'flex')}
        >
          <Button
            variant="character"
            size="sm"
            onClick={recover}
            loading={recovering}
            disabled={recovered}
            aria-describedby={`${titleId}-recover`}
          >
            {t('recover')}
          </Button>
          <p id={`${titleId}-recover`} className="text-caption text-muted-foreground">
            {t('recoverHint')}
          </p>
        </div>
      )}
      <ul
        className={`flex-col gap-1 overflow-y-auto px-3 pb-3 ${collapsed ? 'hidden md:flex' : 'flex'}`}
      >
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <label className="flex min-h-9 flex-1 cursor-pointer items-start gap-2 py-1 text-sm pointer-coarse:min-h-11">
              <input
                type="checkbox"
                checked={ticked.has(item.id)}
                onChange={() => toggle(item.id)}
                className="focus-ring accent-character-flare mt-0.5 size-4 shrink-0"
              />
              <span className={ticked.has(item.id) ? 'text-muted-foreground line-through' : ''}>
                {text(item)}
              </span>
            </label>
            {item.target && (
              <Button
                variant="outline"
                size="sm"
                aria-label={t('goTo', { item: text(item) })}
                onClick={() => go(item.target)}
              >
                {t('go')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </aside>,
    slot ?? document.body,
  );
}
