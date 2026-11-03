'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { ItemDetails } from '@frontend/components/character/inventory/ItemDetails';
import { Popover, PopoverContent, PopoverTrigger } from '@frontend/components/ui/popover';
import { useItems } from '@frontend/hooks/useItems';
import { cn } from '@frontend/lib/utils';

import { parseContentKey } from '@shared/content/content-key';

interface ItemHintProps {
  itemKey: string;
  /** What the button shows; the item's name when omitted. */
  label?: string;
  className?: string;
}

/** An item's rules in a popover, like `ConditionHint`: opens on tap, click or Enter. */
export function ItemHint({ itemKey, label, className }: ItemHintProps) {
  const t = useTranslations('characters.inventory');
  const { byKey } = useItems();
  const titleId = React.useId();
  const [open, setOpen] = React.useState(false);

  const item = byKey.get(itemKey);
  if (!item) return <>{label ?? parseContentKey(itemKey)?.id ?? itemKey}</>;

  // The name has to contain the visible word (WCAG 2.5.3), even when it isn't the item's name
  const ariaLabel =
    label && label.toLowerCase() !== item.name.toLowerCase()
      ? t('tagAriaLabelShown', { text: label, name: item.name })
      : t('tagAriaLabel', { name: item.name });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Not a <button>: on the GM's read-only sheet a disabled fieldset turns buttons off, and
            the GM still needs to read the item's rules (like the backpack row's toggle) */}
        <span
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className={cn(
            'focus-ring touch-target text-primary-flare decoration-primary/60 pointer-events-auto cursor-pointer rounded-sm underline decoration-dotted underline-offset-4',
            className,
          )}
        >
          {label ?? item.name}
        </span>
      </PopoverTrigger>
      <PopoverContent aria-labelledby={titleId}>
        <p id={titleId} className="text-foreground mb-2 font-semibold">
          {item.name} <span className="text-muted-foreground">· {item.edition}</span>
        </p>
        {/* Item tags inside stay plain text: ItemDetails renders them nested */}
        <ItemDetails item={item} nested />
      </PopoverContent>
    </Popover>
  );
}
