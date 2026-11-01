'use client';

import { ReactNode } from 'react';

import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

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
      className="contents [&_input:disabled]:opacity-100 [&_textarea:disabled]:opacity-100"
    >
      {children}
    </fieldset>
  );
}
