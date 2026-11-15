'use client';

import { useEffect, useId, useState } from 'react';

import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { Button } from '@frontend/components/ui/button';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { hitDiceAvailable } from '@frontend/lib/character-sheet-updates';
import { characterTheme } from '@frontend/lib/color-utils';
import { type RestItem, buildRestChecklist } from '@frontend/lib/rest-checklist';

import { getModifier } from '@shared/systems/dnd5e/calculations';

import { useResourceBoxes } from '../resources/useResourceBoxes';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Layers Esc belongs to: a dialog, or a popover/select/menu floating over the sheet. */
const OTHER_LAYER = '[role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]';

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
 * What to update on the sheet after a rest. Ticks live only here: nothing is written to the sheet.
 * Not modal and no focus trap, so the sheet stays editable. On a phone it is a bar above the tab bar.
 */
export function RestChecklist({ rest, onClose }: { rest: 'short' | 'long'; onClose: () => void }) {
  const t = useTranslations('restChecklist');
  const character = useLoadedCharacter();
  const { boxes, content } = useResourceBoxes();
  const titleId = useId();
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  // Phone only: collapsed, the list hides and the bar is one button tall
  const [collapsed, setCollapsed] = useState(false);

  const level = character.level;
  const items = buildRestChecklist({
    rest,
    level,
    hitDie: content?.hitDie ?? null,
    conMod: getModifier(character.attributes.CON ?? 10),
    hitDiceAvailable: hitDiceAvailable(character),
    boxes,
    hasSpellSlots: character.spellcastingSystem === 'slots',
    hasPactSlots: !!content?.resources.some((r) => r.unit === 'spell-slots' && r.level <= level),
  });

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
  };

  const text = (item: RestItem) => {
    const values = item.values && {
      ...item.values,
      ...('amount' in item.values ? { amount: String(item.values.amount) } : {}),
    };
    return t(item.message, values);
  };

  const title = rest === 'short' ? t('shortTitle') : t('longTitle');
  const progress = t('progress', { title, done: ticked.size, total: items.length });
  const theme = characterTheme(character.accentColor);

  // In the body: a transformed ancestor in the page frame would turn `fixed` into relative
  return createPortal(
    <aside
      aria-labelledby={titleId}
      // Out of the sheet's `.character-context`, so it brings the character's color along.
      // Below lg the sticky VitalsBar (~9rem) holds the top: the list stops short of it
      className={`${theme.className} border-border bg-card/95 fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex max-h-[min(60dvh,calc(100dvh_-_3.5rem_-_env(safe-area-inset-bottom)_-_9rem))] flex-col border-t shadow-lg backdrop-blur-md md:inset-x-auto md:right-4 md:bottom-4 md:max-h-[min(70dvh,calc(100dvh_-_1rem_-_9rem))] md:w-80 md:rounded-lg md:border lg:max-h-[70dvh]`}
      style={theme.style}
    >
      <div className="flex items-center justify-between gap-2 px-3">
        <h2 className="min-w-0 flex-1 text-sm font-semibold">
          {/* Phone: the title expands and collapses the list. md+: the list is always open */}
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
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
    document.body,
  );
}
