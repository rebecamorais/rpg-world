'use client';

import { ReactNode } from 'react';

import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { cn } from '@frontend/lib/utils';

/**
 * What a read-only sheet hides or flattens, in one place: a disabled control that still looks
 * editable reads as broken. Gone: the − / + steppers (icons, or the "−" "+" around a count), the
 * gears that open a card's settings, the add (+), remove (trash) and reset buttons, the pencil of
 * a ghost field, a select's chevron, and anything marked `data-sheet-edit` (Pay / Receive).
 * Kept, at full color: the values, and the buttons that show state (proficiency, pips, death
 * saves, an attribute's card), with no pointer cursor.
 */
export const READ_ONLY_SHEET = [
  '[&_button:disabled:has(svg.lucide-minus)]:hidden [&_button:disabled:has(svg.lucide-plus)]:hidden',
  '[&_button:disabled:has(svg.lucide-settings-2)]:hidden [&_button:disabled:has(svg.lucide-trash-2)]:hidden',
  '[&_button:disabled:has(svg.lucide-rotate-ccw)]:hidden',
  // UsePips as a count: "−" before the number, "+" after it (the squares are buttons side by side)
  '[&_[role=group]>button:disabled:has(+span)]:hidden [&_[role=group]>span+button:disabled]:hidden',
  '[&_input:disabled~svg.lucide-pencil]:hidden [&_[role=combobox]:disabled_svg.lucide-chevron-down]:hidden',
  '[&_[data-sheet-edit]]:hidden',
  '[&_button:disabled]:cursor-default [&_button:disabled]:opacity-100 [&_[role=combobox]:disabled]:opacity-100',
].join(' ');

/**
 * Turns off every field and button of the sheet in read-only mode (the GM reading a player's
 * sheet) in one place. Fields keep their full color: they are there to be read.
 */
export function SheetFieldset({ children }: { children: ReactNode }) {
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);

  return (
    <fieldset
      disabled={readOnly}
      data-read-only={readOnly || undefined}
      className={cn(
        'contents [&_input:disabled]:opacity-100 [&_textarea:disabled]:opacity-100',
        readOnly && READ_ONLY_SHEET,
      )}
    >
      {children}
    </fieldset>
  );
}
