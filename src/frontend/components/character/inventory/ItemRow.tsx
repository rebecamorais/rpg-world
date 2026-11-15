'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import type { InventoryItem } from '@frontend/hooks/useInventory';
import { cn } from '@frontend/lib/utils';

import { ItemDetails } from './ItemDetails';
import { ItemImage } from './ItemImage';
import { QuantityStepper } from './QuantityStepper';
import { groupOf, itemGroupStyle } from './item-visuals';
import { useItemFormat } from './useItemFormat';

interface Props {
  entry: InventoryItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

/**
 * One line of the backpack: name, quantity with − / +, weight and price. The details open under it.
 * An item that left the catalog shows its id; its trash (the stepper's − at 1) still removes it.
 */
export function ItemRow({ entry, onQuantity, onRemove }: Props) {
  const t = useTranslations('characters.inventory');
  const fmt = useItemFormat();
  const [open, setOpen] = useState(false);
  const { item, quantity } = entry;
  const name = item?.name ?? entry.ref;
  const group = groupOf(item?.category ?? null);
  const detailsId = `item-details-${entry.id}`;

  return (
    <li className="border-border border-b last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
        <div
          className="item-context bg-item-surface text-item-flare flex size-8 shrink-0 items-center justify-center rounded-md"
          style={itemGroupStyle(group)}
        >
          <ItemImage item={item} size={20} />
        </div>
        <div className="min-w-0 flex-1 basis-40">
          {item ? (
            // Not a <button>: a disabled fieldset (the GM's read-only view) disables buttons, and the
            // GM still needs to read the item's rules
            <span
              role="button"
              tabIndex={0}
              aria-expanded={open}
              aria-controls={detailsId}
              aria-label={t('details', { name })}
              data-item-focus={entry.id}
              onClick={() => setOpen((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }}
              className="text-foreground focus-visible:outline-ring flex w-full cursor-pointer items-center gap-1.5 text-left font-medium focus-visible:outline-2"
            >
              <AppIcon
                name="ChevronRight"
                size={14}
                aria-hidden="true"
                className={cn(
                  'text-muted-foreground shrink-0 transition-transform',
                  open && 'rotate-90',
                )}
              />
              <span className="truncate">{name}</span>
            </span>
          ) : (
            <div>
              <p
                tabIndex={-1}
                className="text-foreground truncate font-medium"
                data-item-focus={entry.id}
              >
                {name}
              </p>
              <p className="text-muted-foreground text-label">{t('unknownHint')}</p>
            </div>
          )}
        </div>

        <QuantityStepper
          name={name}
          quantity={quantity}
          onQuantity={onQuantity}
          onRemove={onRemove}
        />

        <span className="text-muted-foreground hidden w-16 text-right text-sm tabular-nums sm:inline">
          {item?.weight != null ? fmt.weight(item.weight) : ''}
        </span>
        <span className="text-muted-foreground w-20 text-right text-sm tabular-nums">
          {item?.value != null ? fmt.price(item.value) : ''}
        </span>
      </div>

      {item && open && (
        <div id={detailsId} className="bg-background/40 flex flex-col gap-3 px-4 pt-1 pb-3">
          <ItemDetails item={item} />
        </div>
      )}
    </li>
  );
}
