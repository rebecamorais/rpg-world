'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { RestChecklist } from './RestChecklist';

type Rest = 'short' | 'long';

/** "Short rest" / "Long rest" in the sheet's action bar. Each opens the checklist; opening one closes the other. */
export function RestButtons() {
  const t = useTranslations('restChecklist');
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);
  const [open, setOpen] = useState<Rest | null>(null);
  const buttons = useRef<Partial<Record<Rest, HTMLButtonElement | null>>>({});

  if (readOnly) return null;

  const close = () => {
    const opener = open && buttons.current[open];
    setOpen(null);
    opener?.focus();
  };

  return (
    <>
      <Button
        ref={(el) => {
          buttons.current.short = el;
        }}
        variant="outline"
        size="sm"
        onClick={() => setOpen('short')}
      >
        {t('shortRest')}
      </Button>
      <Button
        ref={(el) => {
          buttons.current.long = el;
        }}
        variant="outline"
        size="sm"
        onClick={() => setOpen('long')}
      >
        {t('longRest')}
      </Button>
      {open && <RestChecklist key={open} rest={open} onClose={close} />}
    </>
  );
}
