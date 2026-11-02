'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import type { InventoryItem } from '@frontend/hooks/useInventory';
import { cn } from '@frontend/lib/utils';

import { ItemDetails } from './ItemDetails';
import { useItemFormat } from './useItemFormat';

const MAX_QUANTITY = 9999;

interface Props {
  entry: InventoryItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

/**
 * One line of the backpack: name, quantity with − / +, weight and price. The details (and the
 * remove button) open under it. An item that left the catalog shows its id and can be removed.
 */
export function ItemRow({ entry, onQuantity, onRemove }: Props) {
  const t = useTranslations('characters.inventory');
  const fmt = useItemFormat();
  const [open, setOpen] = useState(false);
  const { item, quantity } = entry;
  const name = item?.name ?? entry.ref;
  const detailsId = `item-details-${entry.id}`;

  return (
    <li className="border-border border-b last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
        <div className="min-w-0 flex-1 basis-40">
          {item ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailsId}
              aria-label={t('details', { name })}
              onClick={() => setOpen((o) => !o)}
              className="text-foreground focus-visible:outline-ring flex w-full items-center gap-1.5 text-left font-medium focus-visible:outline-2"
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
            </button>
          ) : (
            <div>
              <p className="text-foreground truncate font-medium">{name}</p>
              <p className="text-muted-foreground text-label">{t('unknownHint')}</p>
            </div>
          )}
        </div>

        <div className="border-border bg-muted flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-background h-6 w-6 rounded-sm p-0"
            aria-label={t('decrease', { name })}
            disabled={quantity <= 1}
            onClick={() => onQuantity(quantity - 1)}
          >
            <AppIcon name="Minus" size={12} aria-hidden="true" />
          </Button>
          <span
            aria-label={t('quantity', { name })}
            className="min-w-8 text-center font-mono text-sm font-bold tabular-nums"
          >
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-background h-6 w-6 rounded-sm p-0"
            aria-label={t('increase', { name })}
            disabled={quantity >= MAX_QUANTITY}
            onClick={() => onQuantity(quantity + 1)}
          >
            <AppIcon name="Plus" size={12} aria-hidden="true" />
          </Button>
        </div>

        <span className="text-muted-foreground w-16 text-right text-sm tabular-nums">
          {item?.weight != null ? fmt.weight(item.weight) : ''}
        </span>
        <span className="text-muted-foreground w-20 text-right text-sm tabular-nums">
          {item?.value != null ? fmt.price(item.value) : ''}
        </span>

        {!item && (
          <Button variant="ghost" size="sm" aria-label={t('remove', { name })} onClick={onRemove}>
            <AppIcon name="Trash2" size={14} aria-hidden="true" />
          </Button>
        )}
      </div>

      {item && open && (
        <div id={detailsId} className="bg-background/40 flex flex-col gap-3 px-4 pt-1 pb-3">
          <ItemDetails item={item} />
          <div>
            <Button variant="outline" size="sm" onClick={onRemove}>
              <AppIcon name="Trash2" size={14} aria-hidden="true" />
              {t('remove', { name })}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
