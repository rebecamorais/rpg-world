'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';

export const MAX_QUANTITY = 9999;

interface Props {
  name: string;
  quantity: number;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

/** − / + quantity control. At 1 the left button becomes the trash can: one less would be zero. */
export function QuantityStepper({ name, quantity, onQuantity, onRemove }: Props) {
  const t = useTranslations('characters.inventory');
  const atOne = quantity <= 1;

  return (
    <div className="border-border bg-muted flex items-center gap-1 rounded-md border p-0.5">
      {atOne ? (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-background touch-target text-danger-flare h-6 w-6 rounded-sm p-0"
          aria-label={t('remove', { name })}
          onClick={onRemove}
        >
          <AppIcon name="Trash2" size={12} aria-hidden="true" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-background touch-target h-6 w-6 rounded-sm p-0"
          aria-label={t('decrease', { name })}
          onClick={() => onQuantity(quantity - 1)}
        >
          <AppIcon name="Minus" size={12} aria-hidden="true" />
        </Button>
      )}
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
        className="hover:bg-background touch-target h-6 w-6 rounded-sm p-0"
        aria-label={t('increase', { name })}
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onQuantity(quantity + 1)}
      >
        <AppIcon name="Plus" size={12} aria-hidden="true" />
      </Button>
    </div>
  );
}
