'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { type InventoryApi, type InventoryItem, useInventory } from '@frontend/hooks/useInventory';
import { characterTheme } from '@frontend/lib/color-utils';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { AddItemDialog } from './AddItemDialog';
import { ItemRow } from './ItemRow';
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
  icon,
  title,
  hint,
  empty,
  emptyHint,
  dialogStyle,
}: {
  inventory: InventoryApi;
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
        {entries.length > 0 && addButton}
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
          <ul>
            {entries.map((entry) => (
              <ItemRow
                key={entry.id}
                entry={entry}
                onQuantity={(n) => setQuantity(entry.id, n)}
                onRemove={() => remove(entry)}
              />
            ))}
          </ul>
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
