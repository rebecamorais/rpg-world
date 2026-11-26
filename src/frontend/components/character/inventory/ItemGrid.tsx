'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { type InventoryItem, isPendingEntry } from '@frontend/hooks/useInventory';
import { cn } from '@frontend/lib/utils';

import { ItemDetails } from './ItemDetails';
import { ItemImage } from './ItemImage';
import { QuantityStepper, RemoveItemButton } from './QuantityStepper';
import { ADD_ITEM_FOCUS, groupEntries, groupOf, itemGroupStyle } from './item-visuals';
import { useIsRemoved, useRemovedItem } from './removed-items';

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
  const [picked, setPicked] = useState<Pick<InventoryItem, 'id' | 'ref'> | null>(null);
  const isRemoved = useIsRemoved();
  // Derived. A removed entry keeps its panel (as a placeholder) while its toast shows, so what is
  // under the panel doesn't move up under the finger; it closes once the entry leaves the list.
  // A tile still saving hands its panel to the server's entry that replaces it
  const selected =
    (picked &&
      (entries.find((e) => e.id === picked.id) ??
        (isPendingEntry(picked)
          ? entries.find((e) => e.ref === picked.ref && !isPendingEntry(e))
          : undefined))) ??
    null;
  const ordered = groupEntries(entries).flatMap((g) => g.entries);
  const panelId = useId();

  const toggle = (entry: InventoryItem) =>
    setPicked(selected?.id === entry.id ? null : { id: entry.id, ref: entry.ref });

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
              aria-busy={isPendingEntry(entry) || undefined}
              data-focus-key={entry.id}
              onClick={() => toggle(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(entry);
                }
              }}
              className={cn(
                'item-context bg-item-surface text-item-flare focus-visible:outline-ring relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border p-1 focus-visible:outline-2',
                isSelected ? 'border-item ring-item ring-2' : 'border-item-muted',
                // Still saving: there, but not yet the server's
                isPendingEntry(entry) && 'animate-pulse border-dashed',
              )}
              style={itemGroupStyle(groupOf(entry.item?.category ?? null))}
            >
              <ItemImage item={entry.item} size={32} />
              {entry.quantity > 1 && (
                <span className="text-foreground text-label absolute top-0.5 right-1 font-mono font-bold tabular-nums">
                  ×{entry.quantity}
                </span>
              )}
              {/* Sentence case, breaking only between words: in spaced capitals with break-words
                  a tile read "STUDDE D…". The whole name is in the title */}
              <span
                title={name}
                className="text-foreground text-caption line-clamp-2 w-full text-center font-medium break-normal hyphens-auto"
              >
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
          data-focus-key={ADD_ITEM_FOCUS}
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
      <span
        title={name}
        className="text-foreground text-caption line-clamp-2 w-full text-center font-medium break-normal hyphens-auto line-through"
      >
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
  const tCommon = useTranslations('common');
  const { removed, undo } = useRemovedItem(entry.id);
  const pending = isPendingEntry(entry);
  const { item, quantity } = entry;
  const name = item?.name ?? entry.ref;
  const nameId = `${id}-name`;
  const panel = useRef<HTMLDivElement>(null);

  // The panel opens under the grid, often below the fold or behind the phone's tab bar, where a tap
  // looked like it did nothing: bring it into view (the tab bar's scroll-padding counts). Only as
  // far as needed, and without the animation for whoever asked the system for less motion
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panel.current?.scrollIntoView?.({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [entry.id]);

  return (
    <div
      ref={panel}
      id={id}
      role="region"
      aria-labelledby={nameId}
      className="item-context border-item-muted bg-background/40 flex flex-col gap-3 rounded-md border p-3"
      style={itemGroupStyle(groupOf(item?.category ?? null))}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {removed ? (
          <div className="flex min-w-0 items-center gap-2">
            <p
              id={nameId}
              title={name}
              className="text-muted-foreground line-clamp-2 min-w-0 font-medium break-normal hyphens-auto line-through"
            >
              {name}
            </p>
            <span className="sr-only">{t('removedTag')}</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto shrink-0 p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
              aria-label={t('undoRemove', { name })}
              onClick={undo}
            >
              {t('undo')}
            </Button>
          </div>
        ) : (
          <p
            id={nameId}
            title={name}
            className="text-foreground line-clamp-2 min-w-0 font-medium break-normal hyphens-auto"
          >
            {name}
          </p>
        )}
        {pending && (
          <span role="status" className="text-muted-foreground text-caption">
            {tCommon('saving')}
          </span>
        )}
        {/* Removed: same size, but not there, so a tap where the trash was does nothing. Still
            saving: there, but nothing to change until the server has the item */}
        <div
          className={cn('flex items-center gap-3', removed && 'invisible', pending && 'opacity-50')}
          aria-hidden={removed || undefined}
          inert={removed || pending}
        >
          <QuantityStepper name={name} quantity={quantity} onQuantity={onQuantity} />
          <RemoveItemButton name={name} onRemove={onRemove} />
        </div>
      </div>
      <div className={cn(removed && 'opacity-40')} inert={removed}>
        {item ? (
          <ItemDetails item={item} />
        ) : (
          <p className="text-muted-foreground text-caption">{t('unknownHint')}</p>
        )}
      </div>
    </div>
  );
}
