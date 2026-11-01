import { conditionKey } from '@shared/content/content-key';
import type {
  ConditionData,
  ConditionText,
  ConditionTranslation,
} from '@shared/systems/dnd5e/content/condition.schema';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

import type { ConditionCatalog, ConditionDto } from '../domain/condition';

/** The conditions of one book: rules data, English texts and translations by locale. */
export interface ConditionSource {
  source: string;
  edition: Edition;
  conditions: ConditionData[];
  texts: Record<string, ConditionText>;
  translations: Record<string, Record<string, ConditionTranslation>>;
}

interface Entry {
  key: string;
  edition: Edition;
  data: ConditionData;
  text: ConditionText;
  translations: Record<string, ConditionTranslation | undefined>;
}

const FALLBACK_LOCALE = 'en';

/** Official conditions, read from the content files and kept in memory. */
export class FileConditionCatalog implements ConditionCatalog {
  private readonly entries: Entry[];
  private readonly byKey: Map<string, Entry>;
  private readonly locales: Set<string>;

  constructor(sources: ConditionSource[]) {
    this.entries = sources.flatMap(({ source, edition, conditions, texts, translations }) =>
      conditions.map((data) => ({
        key: conditionKey(source, data.id),
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

  list(requestedLocale?: string): ConditionDto[] {
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

  find(key: string): ConditionDto | null {
    const entry = this.byKey.get(key);
    return entry ? toDto(entry, FALLBACK_LOCALE) : null;
  }
}

function toDto(entry: Entry, locale: string): ConditionDto {
  const translation = locale === FALLBACK_LOCALE ? undefined : entry.translations[locale];
  const translated = Object.entries(translation ?? {}).filter(([, value]) => value);
  const text: ConditionText = { ...entry.text, ...Object.fromEntries(translated) };
  return {
    key: entry.key,
    id: entry.data.id,
    edition: entry.edition,
    name: text.name,
    description: text.description,
    maxLevel: entry.data.maxLevel ?? null,
    untranslated: locale !== FALLBACK_LOCALE && !translation?.description,
  };
}
