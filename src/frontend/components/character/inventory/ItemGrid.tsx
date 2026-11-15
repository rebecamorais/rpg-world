'use client';

import { useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import type { InventoryItem } from '@frontend/hooks/useInventory';
import { cn } from '@frontend/lib/utils';

import { ItemDetails } from './ItemDetails';
import { ItemImage } from './ItemImage';
import { QuantityStepper, RemoveItemButton } from './QuantityStepper';
import { ADD_ITEM_FOCUS, groupEntries, groupOf, itemGroupStyle } from './item-visuals';
import { useIsRemoved } from './removed-items';

interface Props {
  entries: InventoryItem[];
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (entry: InventoryItem) => void;
  onAdd: () => void;
  canAdd: boolean;
}

/**
 * The backpack as tiles, in the list's type order. Picking a tile opens a panel under the grid with
 * its quantity and rules; the last tile adds an item.
 */
export function ItemGrid({ entries, onQuantity, onRemove, onAdd, canAdd }: Props) {
  const t = useTranslations('characters.inventory');
  const tCharacters = useTranslations('characters');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isRemoved = useIsRemoved();
  // Derived: once the entry leaves the backpack (removed), the panel closes on its own
  const selected = entries.find((e) => e.id === selectedId && !isRemoved(e.id)) ?? null;
  const ordered = groupEntries(entries).flatMap((g) => g.entries);
  const panelId = useId();

  const toggle = (id: string) => setSelectedId((current) => (current === id ? null : id));

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {ordered.map((entry) => {
          const name = entry.item?.name ?? entry.ref;
          const isSelected = entry.id === selected?.id;
          if (isRemoved(entry.id)) return <RemovedTile key={entry.id} entry={entry} />;
          return (
            // Not a <button>: a disabled fieldset (the GM's read-only view) disables buttons, and the
            // GM still needs to read the item's rules
            <span
              key={entry.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-controls={isSelected ? panelId : undefined}
              aria-label={t('tile', { name, quantity: entry.quantity })}
              data-item-focus={entry.id}
              onClick={() => toggle(entry.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(entry.id);
                }
              }}
              className={cn(
                'item-context bg-item-surface text-item-flare focus-visible:outline-ring relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border p-1 focus-visible:outline-2',
                isSelected ? 'border-item ring-item ring-2' : 'border-item-muted',
              )}
              style={itemGroupStyle(groupOf(entry.item?.category ?? null))}
            >
              <ItemImage item={entry.item} size={32} />
              {entry.quantity > 1 && (
                <span className="text-foreground text-label absolute top-0.5 right-1 font-mono font-bold tabular-nums">
                  ×{entry.quantity}
                </span>
              )}
              <span className="text-foreground text-label line-clamp-2 w-full text-center break-words">
                {name}
              </span>
            </span>
          );
        })}
        <Button
          variant="outline"
          aria-label={tCharacters('addItem')}
          disabled={!canAdd}
          onClick={onAdd}
          data-item-focus={ADD_ITEM_FOCUS}
          className="text-muted-foreground aspect-square h-auto rounded-md border-dashed"
        >
          <AppIcon name="Plus" size={20} aria-hidden="true" />
        </Button>
      </div>

      {selected && (
        <GridPanel
          id={panelId}
          entry={selected}
          onQuantity={(n) => onQuantity(selected.id, n)}
          onRemove={() => onRemove(selected)}
        />
      )}
    </div>
  );
}

/** A tile holds its place, faded, until the removal's toast closes, so the grid doesn't shift. */
function RemovedTile({ entry }: { entry: InventoryItem }) {
  const t = useTranslations('characters.inventory');
  const name = entry.item?.name ?? entry.ref;

  return (
    <span
      className="item-context bg-item-surface text-item-flare border-item-muted relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed p-1 opacity-40"
      style={itemGroupStyle(groupOf(entry.item?.category ?? null))}
    >
      <ItemImage item={entry.item} size={32} />
      <span className="text-foreground text-label line-clamp-2 w-full text-center break-words line-through">
        {name}
      </span>
      <span className="sr-only">{t('removedTag')}</span>
    </span>
  );
}

function GridPanel({
  id,
  entry,
  onQuantity,
  onRemove,
}: {
  id: string;
  entry: InventoryItem;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('characters.inventory');
  const { item, quantity } = entry;
  const name = item?.name ?? entry.ref;
  const nameId = `${id}-name`;

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={nameId}
      className="item-context border-item-muted bg-background/40 flex flex-col gap-3 rounded-md border p-3"
      style={itemGroupStyle(groupOf(item?.category ?? null))}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={nameId} className="text-foreground min-w-0 truncate font-medium">
          {name}
        </p>
        <div className="flex items-center gap-3">
          <QuantityStepper name={name} quantity={quantity} onQuantity={onQuantity} />
          <RemoveItemButton name={name} onRemove={onRemove} />
        </div>
      </div>
      {item ? (
        <ItemDetails item={item} />
      ) : (
        <p className="text-muted-foreground text-label">{t('unknownHint')}</p>
      )}
    </div>
  );
}
