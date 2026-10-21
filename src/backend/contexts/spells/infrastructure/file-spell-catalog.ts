import { spellKey } from '@shared/content/content-key';
import type { SpellData, SpellText } from '@shared/systems/dnd5e/content/spell.schema';

import type {
  FindSpellsParams,
  PaginatedSpells,
  SpellDto,
  SpellsRepo,
} from '../domain/repository/spells.repo';

/** The spells of one book: rules data plus texts by locale (`texts[locale][id]`). */
export interface SpellSource {
  source: string;
  spells: SpellData[];
  texts: Record<string, Record<string, SpellText>>;
}

interface Entry {
  key: string;
  data: SpellData;
  texts: Record<string, SpellText | undefined>;
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
    this.entries = sources.flatMap(({ source, spells, texts }) =>
      spells.map((data) => ({
        key: spellKey(source, data.id),
        data,
        texts: Object.fromEntries(
          Object.entries(texts).map(([locale, byId]) => [locale, byId[data.id]]),
        ),
      })),
    );
    this.byKey = new Map(this.entries.map((entry) => [entry.key, entry]));
    this.locales = new Set(sources.flatMap(({ texts }) => Object.keys(texts)));
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
      .filter(({ entry: { data }, text }) => {
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
        .map(({ entry, text }) => toDto(entry, text)),
      total: matches.length,
    };
  }

  async findByKeys(keys: string[], requestedLocale?: string): Promise<SpellDto[]> {
    const locale = this.resolveLocale(requestedLocale);
    return keys.flatMap((key) => {
      const entry = this.byKey.get(key);
      return entry ? [toDto(entry, this.textOf(entry, locale))] : [];
    });
  }

  /** Text in `locale`, or in English while the spell has no translation yet. */
  private textOf(entry: Entry, locale: string): SpellText {
    return entry.texts[locale] ?? entry.texts[FALLBACK_LOCALE]!;
  }
}

function toDto({ key, data }: Entry, text: SpellText): SpellDto {
  return {
    id: key,
    name: text.name,
    description: text.description,
    higherLevel: text.higherLevel,
    material: text.material,
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
