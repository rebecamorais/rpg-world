'use client';

import { useId } from 'react';

import { useTranslations } from 'next-intl';

import type { InventoryItem } from '@frontend/hooks/useInventory';

import { ItemRow } from './ItemRow';
import { groupEntries, itemGroupStyle } from './item-visuals';
import { useItemFormat } from './useItemFormat';

interface Props {
  entries: InventoryItem[];
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (entry: InventoryItem) => void;
}

/** The backpack's items in one section per type (weapons, armor, ...), each with its weight. */
export function GroupedItemList({ entries, onQuantity, onRemove }: Props) {
  const t = useTranslations('characters.inventory');
  const fmt = useItemFormat();
  const baseId = useId();

  return (
    <div>
      {groupEntries(entries).map(({ group, entries: inGroup, weight }) => {
        const headingId = `${baseId}-${group}`;
        return (
          <section key={group} aria-labelledby={headingId}>
            <div
              className="item-context border-border bg-muted/40 text-item-flare text-label flex items-center justify-between border-b px-4 py-1.5 font-semibold"
              style={itemGroupStyle(group)}
            >
              <h3 id={headingId} className="text-item-flare">
                {t(`group.${group}`)}
              </h3>
              <span className="tabular-nums">{fmt.weight(weight)}</span>
            </div>
            <ul>
              {inGroup.map((entry) => (
                <ItemRow
                  key={entry.id}
                  entry={entry}
                  onQuantity={(n) => onQuantity(entry.id, n)}
                  onRemove={() => onRemove(entry)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
