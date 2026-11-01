import type { Spell } from '@frontend/types/spells';

/** "longer" is anything cast in minutes, hours or days. */
export const SPELLBOOK_CASTING_TIMES = ['action', 'bonus_action', 'reaction', 'longer'] as const;
export type SpellbookCastingTime = (typeof SPELLBOOK_CASTING_TIMES)[number];

export interface SpellbookFilters {
  search: string;
  preparedOnly: boolean;
  concentration: boolean;
  ritual: boolean;
  school: string | null;
  damage: string | null;
  castingTime: SpellbookCastingTime | null;
}

export const NO_SPELLBOOK_FILTERS: SpellbookFilters = {
  search: '',
  preparedOnly: false,
  concentration: false,
  ritual: false,
  school: null,
  damage: null,
  castingTime: null,
};

const LONGER_CASTING_TIMES = ['minute', 'hour', 'day'];

/** Case and accent insensitive: "relampago" finds "Relâmpago". */
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function castingTimeMatches(spell: Spell, wanted: SpellbookCastingTime): boolean {
  const times = [spell.castingTime, ...(spell.extraCastingTimes ?? []).map((t) => t.castingTime)];
  return wanted === 'longer'
    ? times.some((time) => time && LONGER_CASTING_TIMES.includes(time))
    : times.includes(wanted);
}

/** The learned spells that pass every filter that is on. Runs on the client: the list is whole. */
export function filterSpellbook(spells: Spell[], filters: SpellbookFilters): Spell[] {
  const search = normalize(filters.search.trim());
  return spells.filter(
    (spell) =>
      (!search || normalize(spell.name).includes(search)) &&
      (!filters.preparedOnly || spell.isPrepared) &&
      (!filters.concentration || spell.concentration) &&
      (!filters.ritual || spell.ritual) &&
      (!filters.school || spell.school === filters.school) &&
      (!filters.damage || spell.damageType === filters.damage) &&
      (!filters.castingTime || castingTimeMatches(spell, filters.castingTime)),
  );
}

/** Filters that are on, not counting the search box (it shows its own text). */
export function activeSpellbookFilterCount(filters: SpellbookFilters): number {
  const { search: _search, ...rest } = filters;
  return Object.values(rest).filter((value) => value !== null && value !== false).length;
}
