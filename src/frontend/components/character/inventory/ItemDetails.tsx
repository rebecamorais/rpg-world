'use client';

import { useTranslations } from 'next-intl';

import { RulesText } from '@frontend/components/content/RulesText';
import { AppIcon } from '@frontend/components/ui/icon';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { parseContentKey } from '@shared/content/content-key';

import { useItemFormat } from './useItemFormat';

/** The rules of an item: price, weight, armor and weapon numbers, and its description. `nested` keeps tags in the description as plain text (inside a popover). */
export function ItemDetails({ item, nested = false }: { item: ItemDto; nested?: boolean }) {
  const t = useTranslations('characters.inventory.stats');
  const tCharacters = useTranslations('characters');
  const tCategory = useTranslations('characters.inventory.category');
  const tProps = useTranslations('characters.inventory.properties');
  const tDamage = useTranslations('spellsData.damageTypes');
  const fmt = useItemFormat();
  const source = parseContentKey(item.key)?.source ?? '';

  const stats: { label: string; value: string }[] = [];
  stats.push({ label: t('category'), value: tCategory(item.category) });
  if (item.value !== null) stats.push({ label: t('price'), value: fmt.price(item.value) });
  if (item.weight !== null) stats.push({ label: t('weight'), value: fmt.weight(item.weight) });
  if (item.ac !== null) stats.push({ label: t('ac'), value: String(item.ac) });
  if (item.strength !== null) stats.push({ label: t('strength'), value: String(item.strength) });
  if (item.stealthDisadvantage) {
    stats.push({ label: t('stealth'), value: t('stealthDisadvantage') });
  }
  if (item.damage) {
    const type = tDamage.has(item.damage.type as never)
      ? tDamage(item.damage.type as never)
      : item.damage.type;
    stats.push({ label: t('damage'), value: `${item.damage.dice} ${type}` });
  }
  // Versatile damage and range go with their property; without it they stand alone
  const hasVersatile = item.properties.includes('V') && !!item.versatile;
  const hasRange = !!item.range && item.properties.some((p) => p === 'T' || p === 'A');
  if (item.properties.length > 0) {
    const label = (code: string) => {
      const name = tProps.has(code as never) ? tProps(code as never) : code;
      if (code === 'V' && hasVersatile) return `${name} (${item.versatile})`;
      if ((code === 'T' || code === 'A') && hasRange) return `${name} (${item.range})`;
      return name;
    };
    stats.push({ label: t('properties'), value: item.properties.map(label).join(', ') });
  }
  if (item.versatile && !hasVersatile) stats.push({ label: t('versatile'), value: item.versatile });
  if (item.range && !hasRange) stats.push({ label: t('range'), value: item.range });

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
          <RulesText text={item.description} source={source} nested={nested} />
        </p>
      )}
    </div>
  );
}
