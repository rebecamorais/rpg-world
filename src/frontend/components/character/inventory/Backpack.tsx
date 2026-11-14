'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { type InventoryApi, type InventoryItem, useInventory } from '@frontend/hooks/useInventory';
import {
  INVENTORY_VIEW_KEYS,
  type InventoryView,
  useInventoryView,
} from '@frontend/hooks/useInventoryView';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { AddItemDialog } from './AddItemDialog';
import { GroupedItemList } from './GroupedItemList';
import { ItemGrid } from './ItemGrid';
import { useItemFormat } from './useItemFormat';

/** The edition most of the backpack's items are from; 2024 when it is empty (or a tie). */
function commonEdition(entries: InventoryItem[]): Edition {
  const count = { '2014': 0, '2024': 0 };
  for (const { item } of entries) if (item) count[item.edition] += 1;
  return count['2014'] > count['2024'] ? '2014' : '2024';
}

/** What the character carries, apart from the coins. */
export function Backpack() {
  const t = useTranslations('characters.inventory');
  const character = useLoadedCharacter();
  const inventory = useInventory(character.id);

  return (
    <ItemList
      inventory={inventory}
      viewKey={INVENTORY_VIEW_KEYS.backpack}
      icon="Backpack"
      title={t('title')}
      hint={t('hint')}
      empty={t('empty')}
      emptyHint={t('emptyHint')}
      dialogStyle={characterTheme(character.accentColor).style}
    />
  );
}

/**
 * The items of a container (a character's backpack, or the party chest), apart from the coins.
 * Every change is saved on the spot.
 */
export function ItemList({
  inventory: source,
  viewKey,
  icon,
  title,
  hint,
  empty,
  emptyHint,
  dialogStyle,
}: {
  inventory: InventoryApi;
  /** Where the list / grid choice is remembered (see `INVENTORY_VIEW_KEYS`). */
  viewKey: string;
  icon: string;
  title: string;
  hint: string;
  empty: string;
  emptyHint: string;
  dialogStyle?: React.CSSProperties;
}) {
  const t = useTranslations('characters.inventory');
  const tCharacters = useTranslations('characters');
  const { backpack, inventory, addItem, setQuantity, removeItem, restoreItem } = source;
  const fmt = useItemFormat();
  const [adding, setAdding] = useState(false);
  const [view, setView] = useInventoryView(viewKey);

  const entries = (inventory?.items ?? []).filter((i) => i.containerId === backpack?.id);
  const totalWeight = entries.reduce((sum, i) => sum + (i.item?.weight ?? 0) * i.quantity, 0);

  const remove = (entry: InventoryItem) => {
    const name = entry.item?.name ?? entry.ref;
    removeItem(entry.id);
    toast(t('removed', { name }), {
      action: { label: t('undo'), onClick: () => restoreItem(entry) },
    });
  };

  const addButton = (
    <Button
      variant="outline"
      size="sm"
      disabled={!backpack}
      onClick={() => setAdding(true)}
      className="text-label h-8 px-3"
    >
      <AppIcon name="Plus" size={14} aria-hidden="true" />
      {tCharacters('addItem')}
    </Button>
  );

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon={icon} hint={hint}>
          {title}
        </SectionCard.Title>
        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            <ViewToggle view={view} onChange={setView} />
            {addButton}
          </div>
        )}
      </SectionCard.Header>

      {entries.length === 0 ? (
        <SectionCard.Body>
          <EmptyState
            icon={icon}
            title={empty}
            description={emptyHint}
            action={addButton}
            className="border-none bg-transparent"
          />
        </SectionCard.Body>
      ) : (
        <>
          {view === 'grid' ? (
            <ItemGrid
              entries={entries}
              onQuantity={setQuantity}
              onRemove={remove}
              onAdd={() => setAdding(true)}
              canAdd={!!backpack}
            />
          ) : (
            <GroupedItemList entries={entries} onQuantity={setQuantity} onRemove={remove} />
          )}
          <p className="bg-muted/40 border-border text-muted-foreground border-t px-4 py-2 text-right text-sm">
            {t('totalWeight', { weight: fmt.weight(totalWeight) })}
          </p>
        </>
      )}

      <AddItemDialog
        open={adding}
        onOpenChange={setAdding}
        initialEdition={commonEdition(entries)}
        onPick={(key) => addItem(key)}
        style={dialogStyle}
      />
    </SectionCard>
  );
}

const VIEWS: { value: InventoryView; icon: string; label: 'viewList' | 'viewGrid' }[] = [
  { value: 'list', icon: 'List', label: 'viewList' },
  { value: 'grid', icon: 'LayoutGrid', label: 'viewGrid' },
];

/**
 * List / grid switch. Spans with radio roles, not buttons: the GM's read-only sheet sits in a
 * disabled fieldset, and the GM can still pick how to read the backpack.
 */
function ViewToggle({
  view,
  onChange,
}: {
  view: InventoryView;
  onChange: (view: InventoryView) => void;
}) {
  const t = useTranslations('characters.inventory');
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});

  const pick = (next: InventoryView, focus = false) => {
    onChange(next);
    if (focus) refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('view')}
      className="border-border bg-muted flex items-center gap-0.5 rounded-md border p-0.5"
    >
      {VIEWS.map(({ value, icon, label }, index) => {
        const checked = view === value;
        return (
          <span
            key={value}
            ref={(el) => {
              refs.current[value] = el;
            }}
            role="radio"
            tabIndex={checked ? 0 : -1}
            aria-checked={checked}
            aria-label={t(label)}
            onClick={() => pick(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick(value);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const step = e.key === 'ArrowRight' ? 1 : -1;
                pick(VIEWS[(index + step + VIEWS.length) % VIEWS.length].value, true);
              }
            }}
            className={cn(
              'focus-visible:outline-ring touch-target flex h-6 w-7 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-2',
              checked
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <AppIcon name={icon} size={14} aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}
