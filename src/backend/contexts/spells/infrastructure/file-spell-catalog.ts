import { spellKey } from '@shared/content/content-key';
import type { Edition } from '@shared/systems/dnd5e/content/editions';
import type {
  SpellData,
  SpellText,
  SpellTranslation,
} from '@shared/systems/dnd5e/content/spell.schema';

import type {
  FindSpellsParams,
  PaginatedSpells,
  SpellDto,
  SpellsRepo,
} from '../domain/repository/spells.repo';

/**
 * The spells of one book: rules data, the English texts and the translations by locale
 * (`translations[locale][id]`, possibly partial).
 */
export interface SpellSource {
  source: string;
  edition: Edition;
  spells: SpellData[];
  texts: Record<string, SpellText>;
  translations: Record<string, Record<string, SpellTranslation>>;
}

interface Entry {
  key: string;
  edition: Edition;
  data: SpellData;
  text: SpellText;
  translations: Record<string, SpellTranslation | undefined>;
}

const FALLBACK_LOCALE = 'en';

/** Case and accent insensitive: "relampago" finds "Relâmpago". */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Official spells, read from the content files and kept in memory. A few hundred entries per
 * book, so filtering and sorting here is quick.
 */
export class FileSpellCatalog implements SpellsRepo {
  private readonly entries: Entry[];
  private readonly byKey: Map<string, Entry>;
  private readonly locales: Set<string>;

  constructor(sources: SpellSource[]) {
    this.entries = sources.flatMap(({ source, edition, spells, texts, translations }) =>
      spells.map((data) => ({
        key: spellKey(source, data.id),
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

  /** A locale the files have; anything else (`pt_BR`, `__proto__`…) reads as English. */
  private resolveLocale(locale: string | undefined): string {
    return locale && this.locales.has(locale) ? locale : FALLBACK_LOCALE;
  }

  async findAll(params: FindSpellsParams = {}): Promise<PaginatedSpells> {
    const locale = this.resolveLocale(params.locale);
    const page = params.page || 0;
    const limit = params.limit || 12;
    const search = params.search ? normalize(params.search) : undefined;

    const matches = this.entries
      .map((entry) => ({ entry, text: this.textOf(entry, locale) }))
      .filter(({ entry: { data, edition }, text }) => {
        if (params.edition && edition !== params.edition) return false;
        if (search && !normalize(text.name).includes(search)) return false;
        if (params.level !== undefined && params.level !== null && data.level !== params.level) {
          return false;
        }
        if (params.school && data.school !== params.school) return false;
        if (params.class && !data.classes.includes(params.class)) return false;
        if (params.damageType && data.damageType !== params.damageType) return false;
        return true;
      })
      // Level, then name, then key: a stable order, so pages never repeat or skip a spell
      .sort(
        (a, b) =>
          a.entry.data.level - b.entry.data.level ||
          a.text.name.localeCompare(b.text.name, locale) ||
          a.entry.key.localeCompare(b.entry.key),
      );

    return {
      data: matches
        .slice(page * limit, (page + 1) * limit)
        .map(({ entry, text }) => toDto(entry, text, locale)),
      total: matches.length,
    };
  }

  async findByKeys(keys: string[], requestedLocale?: string): Promise<SpellDto[]> {
    const locale = this.resolveLocale(requestedLocale);
    return keys.flatMap((key) => {
      const entry = this.byKey.get(key);
      return entry ? [toDto(entry, this.textOf(entry, locale), locale)] : [];
    });
  }

  /** Text in `locale`; each field not translated yet stays in English. */
  private textOf(entry: Entry, locale: string): SpellText {
    const translation = locale === FALLBACK_LOCALE ? undefined : entry.translations[locale];
    if (!translation) return entry.text;
    const translated = Object.entries(translation).filter(([, value]) => value);
    return { ...entry.text, ...Object.fromEntries(translated) };
  }
}

function toDto(entry: Entry, text: SpellText, locale: string): SpellDto {
  const { key, edition, data } = entry;
  return {
    id: key,
    edition,
    untranslated: locale !== FALLBACK_LOCALE && !entry.translations[locale]?.description,
    name: text.name,
    description: text.description,
    higherLevel: text.higherLevel ?? null,
    material: text.material ?? null,
    level: data.level,
    school: data.school,
    classes: data.classes,
    components: data.components,
    castingTime: data.castingTime,
    castingValue: data.castingValue,
    rangeUnit: data.rangeUnit,
    rangeValue: data.rangeValue,
    durationUnit: data.durationUnit,
    durationValue: data.durationValue,
    concentration: data.concentration,
    ritual: data.ritual,
    materialCost: data.materialCost,
    isScaling: data.isScaling,
    damageType: data.damageType ?? undefined,
    spellCategory: data.spellCategory ?? undefined,
    bgStyleId: data.bgStyleId ?? undefined,
  };
}
