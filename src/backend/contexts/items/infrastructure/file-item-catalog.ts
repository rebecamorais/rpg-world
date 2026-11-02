import { itemKey } from '@shared/content/content-key';
import type { Edition } from '@shared/systems/dnd5e/content/editions';
import type {
  ItemData,
  ItemText,
  ItemTranslation,
} from '@shared/systems/dnd5e/content/item.schema';

import type { ItemCatalog, ItemDto } from '../domain/item';

/** The items of one book: rules data, English texts and translations by locale. */
export interface ItemSource {
  source: string;
  edition: Edition;
  items: ItemData[];
  texts: Record<string, ItemText>;
  translations: Record<string, Record<string, ItemTranslation>>;
}

interface Entry {
  key: string;
  edition: Edition;
  data: ItemData;
  text: ItemText;
  translations: Record<string, ItemTranslation | undefined>;
}

const FALLBACK_LOCALE = 'en';

/** Official common items, read from the content files and kept in memory. */
export class FileItemCatalog implements ItemCatalog {
  private readonly entries: Entry[];
  private readonly byKey: Map<string, Entry>;
  private readonly locales: Set<string>;

  constructor(sources: ItemSource[]) {
    this.entries = sources.flatMap(({ source, edition, items, texts, translations }) =>
      items.map((data) => ({
        key: itemKey(source, data.id),
        edition,
        data,
        text: texts[data.id],
        translations: Object.fromEntries(
          Object.entries(translations).map(([locale, byId]) => [locale, byId[data.id]]),
        ),
      })),
    );
    this.byKey = new Map(this.entries.map((entry) => [entry.key, entry]));
    this.locales = new Set([
      FALLBACK_LOCALE,
      ...sources.flatMap(({ translations }) => Object.keys(translations)),
    ]);
  }

  /** A locale the files have; anything else reads as English. */
  private resolveLocale(locale: string | undefined): string {
    return locale && this.locales.has(locale) ? locale : FALLBACK_LOCALE;
  }

  list(requestedLocale?: string): ItemDto[] {
    const locale = this.resolveLocale(requestedLocale);
    return this.entries
      .map((entry) => toDto(entry, locale))
      .sort(
        (a, b) =>
          a.edition.localeCompare(b.edition) ||
          a.name.localeCompare(b.name, locale) ||
          a.key.localeCompare(b.key),
      );
  }

  find(key: string): ItemDto | null {
    const entry = this.byKey.get(key);
    return entry ? toDto(entry, FALLBACK_LOCALE) : null;
  }

  findByKeys(keys: string[], requestedLocale?: string): ItemDto[] {
    const locale = this.resolveLocale(requestedLocale);
    return keys.flatMap((key) => {
      const entry = this.byKey.get(key);
      return entry ? [toDto(entry, locale)] : [];
    });
  }
}

function toDto(entry: Entry, locale: string): ItemDto {
  const { data, text } = entry;
  const translation = locale === FALLBACK_LOCALE ? undefined : entry.translations[locale];
  const description = translation?.description || text.description || null;
  return {
    key: entry.key,
    id: data.id,
    edition: entry.edition,
    category: data.category,
    name: translation?.name || text.name,
    description,
    value: data.value ?? null,
    weight: data.weight ?? null,
    strength: data.strength ?? null,
    stealthDisadvantage: data.stealthDisadvantage ?? false,
    ac: data.ac ?? null,
    damage: data.damage ?? null,
    versatile: data.versatile ?? null,
    properties: data.properties ?? [],
    range: data.range ?? null,
    untranslated:
      locale !== FALLBACK_LOCALE &&
      (!translation?.name || (!!text.description && !translation.description)),
  };
}
