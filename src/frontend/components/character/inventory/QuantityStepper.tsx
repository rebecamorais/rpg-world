'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

export const MAX_QUANTITY = 9999;

// 44px on touch screens (the real size, not a hit area that would overlap the next button)
const STEP = 'hover:bg-muted size-8 rounded-sm p-0 pointer-coarse:size-11';

interface Props {
  name: string;
  quantity: number;
  onQuantity: (quantity: number) => void;
}

/**
 * − / + quantity control, the same in the list and in the grid's panel. − stops at 1: removing is
 * its own button (`RemoveItemButton`), away from it, so quick taps on − never delete the item.
 */
export function QuantityStepper({ name, quantity, onQuantity }: Props) {
  const t = useTranslations('characters.inventory');

  return (
    <div className="border-border bg-background/60 flex items-center gap-0.5 rounded-md border p-0.5">
      <Button
        variant="ghost"
        size="icon"
        className={STEP}
        aria-label={t('decrease', { name })}
        disabled={quantity <= 1}
        onClick={() => onQuantity(quantity - 1)}
      >
        <AppIcon name="Minus" size={14} aria-hidden="true" />
      </Button>
      {/* <output>, not a <span>: a name on a plain span is not read; this one also announces
          the new quantity after − / + */}
      <output
        aria-label={t('quantity', { name })}
        className="min-w-8 text-center font-mono text-sm font-bold tabular-nums"
      >
        {quantity}
      </output>
      <Button
        variant="ghost"
        size="icon"
        className={STEP}
        aria-label={t('increase', { name })}
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onQuantity(quantity + 1)}
      >
        <AppIcon name="Plus" size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Takes the item out of the backpack. Red, and never where − was: the toast offers Undo. */
export function RemoveItemButton({
  name,
  onRemove,
  className,
}: {
  name: string;
  onRemove: () => void;
  className?: string;
}) {
  const t = useTranslations('characters.inventory');

  return (
    <Button
      variant="destructive-ghost"
      size="icon"
      className={cn('size-8 shrink-0 rounded-md p-0 pointer-coarse:size-11', className)}
      aria-label={t('remove', { name })}
      onClick={onRemove}
    >
      <AppIcon name="Trash2" size={16} aria-hidden="true" />
    </Button>
  );
}
