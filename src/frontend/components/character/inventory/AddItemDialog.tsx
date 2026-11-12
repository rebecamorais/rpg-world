'use client';

import { useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { useItems } from '@frontend/hooks/useItems';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { normalizeSearch } from '@shared/content/normalize-search';
import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';
import { ITEM_CATEGORIES, type ItemCategory } from '@shared/systems/dnd5e/content/item.schema';

import { useItemFormat } from './useItemFormat';

/** More rows than this is more than anyone scrolls: the search narrows it down. */
const MAX_ROWS = 100;
const FILTER_CLASS = 'border-border bg-muted text-foreground h-10 w-full gap-2 sm:w-auto';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The edition the filter starts on. */
  initialEdition: Edition;
  /** Called with the item's key; the dialog closes itself. */
  onPick: (key: string) => void;
  /** The sheet's accent colors (a character's dialog); the app's own without it. */
  style?: React.CSSProperties;
}

/** Search the SRD's common items and add one to the backpack. */
export function AddItemDialog({ open, onOpenChange, initialEdition, onPick, style }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <AddItemContent
          initialEdition={initialEdition}
          style={style}
          onPick={(key) => {
            onPick(key);
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}

function AddItemContent({
  initialEdition,
  onPick,
  style,
}: Pick<Props, 'initialEdition' | 'onPick' | 'style'>) {
  const tAdd = useTranslations('characters.inventory.add');
  const tCategories = useTranslations('characters.inventory.categories');
  const tCategory = useTranslations('characters.inventory.category');
  const tEditions = useTranslations('spellsDrawer.editions');
  const { list, isLoading } = useItems();
  const fmt = useItemFormat();

  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState<Edition | null>(initialEdition);
  const [category, setCategory] = useState<ItemCategory | null>(null);

  const matches = useMemo(() => {
    const needle = normalizeSearch(search.trim());
    return list.filter((item) => {
      if (edition && item.edition !== edition) return false;
      if (category && item.category !== category) return false;
      // The id is the English name ("rope-hempen"), so an English search finds a translated item
      return (
        !needle ||
        normalizeSearch(item.name).includes(needle) ||
        normalizeSearch(item.id.replaceAll('-', ' ')).includes(needle)
      );
    });
  }, [list, search, edition, category]);

  const tooMany = matches.length > MAX_ROWS;
  const filtered = search.trim() !== '' || edition !== null || category !== null;
  const clear = () => {
    setSearch('');
    setEdition(null);
    setCategory(null);
  };

  return (
    <DialogContent
      className="character-context bg-background flex h-[90dvh] max-w-2xl flex-col gap-0 p-0"
      style={style}
    >
      <DialogHeader className="border-border border-b p-4 sm:p-6">
        <DialogTitle>{tAdd('title')}</DialogTitle>
        <DialogDescription>{tAdd('description')}</DialogDescription>

        <div className="mt-3 flex flex-col gap-3">
          <div className="relative">
            <AppIcon
              name="Search"
              size={18}
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              aria-label={tAdd('searchLabel')}
              placeholder={tAdd('searchPlaceholder')}
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-muted text-foreground pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <SelectField
              aria-label={tAdd('edition')}
              value={edition ?? 'all'}
              onValueChange={(v) => setEdition(v === 'all' ? null : (v as Edition))}
              className={`${FILTER_CLASS} sm:min-w-[150px]`}
              options={[
                { value: 'all', label: tAdd('allEditions') },
                ...EDITIONS.map((e) => ({ value: e, label: tEditions(e) })),
              ]}
            />
            <SelectField
              aria-label={tAdd('category')}
              value={category ?? 'all'}
              onValueChange={(v) => setCategory(v === 'all' ? null : (v as ItemCategory))}
              className={`${FILTER_CLASS} sm:min-w-[200px]`}
              options={[
                { value: 'all', label: tAdd('allCategories') },
                ...ITEM_CATEGORIES.map((c) => ({ value: c, label: tCategories(c) })),
              ]}
            />
          </div>
        </div>
      </DialogHeader>

      <p role="status" className="sr-only">
        {isLoading ? tAdd('loading') : tAdd('count', { count: matches.length })}
      </p>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-2 sm:p-4" aria-busy={isLoading}>
        {!isLoading && matches.length === 0 ? (
          <EmptyState
            icon="Search"
            title={tAdd('noResults')}
            className="h-64 border-none bg-transparent"
            action={
              filtered && (
                <Button variant="link" onClick={clear} className="text-character-flare">
                  {tAdd('clear')}
                </Button>
              )
            }
          />
        ) : (
          <ul>
            {matches.slice(0, MAX_ROWS).map((item) => (
              <PickRow
                key={item.key}
                item={item}
                label={tAdd('pick', { name: item.name })}
                category={tCategory(item.category)}
                edition={edition ? null : tEditions(item.edition)}
                price={item.value !== null ? fmt.price(item.value) : null}
                weight={item.weight !== null ? fmt.weight(item.weight) : null}
                onPick={() => onPick(item.key)}
              />
            ))}
          </ul>
        )}
        {tooMany && (
          <p className="text-muted-foreground text-label px-3 py-2">
            {tAdd('tooMany', { max: MAX_ROWS })}
          </p>
        )}
      </div>
    </DialogContent>
  );
}

function PickRow({
  item,
  label,
  category,
  edition,
  price,
  weight,
  onPick,
}: {
  item: ItemDto;
  label: string;
  category: string;
  edition: string | null;
  price: string | null;
  weight: string | null;
  onPick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-label={label}
        onClick={onPick}
        className="hover:bg-muted focus-visible:outline-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left focus-visible:outline-2"
      >
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate font-medium">{item.name}</span>
          <span className="text-muted-foreground text-label block">
            {[category, edition].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="text-muted-foreground flex flex-col items-end text-sm tabular-nums">
          <span>{price}</span>
          <span className="text-label">{weight}</span>
        </span>
        <AppIcon
          name="Plus"
          size={16}
          aria-hidden="true"
          className="text-character-flare shrink-0"
        />
      </button>
    </li>
  );
}
