'use client';

import { useTranslations } from 'next-intl';

import { RulesText } from '@frontend/components/content/RulesText';
import { AppIcon } from '@frontend/components/ui/icon';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { parseContentKey } from '@shared/content/content-key';

import { useItemFormat } from './useItemFormat';

/** The rules of an item: price, weight, armor and weapon numbers, and its description. */
export function ItemDetails({ item }: { item: ItemDto }) {
  const t = useTranslations('characters.inventory.stats');
  const tCharacters = useTranslations('characters');
  const fmt = useItemFormat();
  const source = parseContentKey(item.key)?.source ?? '';

  const stats: { label: string; value: string }[] = [];
  if (item.value !== null) stats.push({ label: t('price'), value: fmt.price(item.value) });
  if (item.weight !== null) stats.push({ label: t('weight'), value: fmt.weight(item.weight) });
  if (item.ac !== null) stats.push({ label: t('ac'), value: String(item.ac) });
  if (item.strength !== null) stats.push({ label: t('strength'), value: String(item.strength) });
  if (item.stealthDisadvantage) {
    stats.push({ label: t('stealth'), value: t('stealthDisadvantage') });
  }
  if (item.damage) {
    stats.push({ label: t('damage'), value: `${item.damage.dice} ${item.damage.type}` });
  }
  if (item.versatile) stats.push({ label: t('versatile'), value: item.versatile });
  if (item.range) stats.push({ label: t('range'), value: item.range });

  return (
    <div className="flex flex-col gap-3 text-sm">
      {item.untranslated && (
        <p className="text-muted-foreground text-label flex items-center gap-1.5">
          <AppIcon name="Languages" size="xs" aria-hidden="true" />
          <span className="text-foreground font-medium">{tCharacters('untranslatedBadge')}</span>
          <span>{tCharacters('untranslatedHint')}</span>
        </p>
      )}
      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-label text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {item.description && (
        <p
          lang={item.untranslated ? 'en' : undefined}
          className="text-foreground/90 leading-relaxed whitespace-pre-line"
        >
          <RulesText text={item.description} source={source} />
        </p>
      )}
    </div>
  );
}
