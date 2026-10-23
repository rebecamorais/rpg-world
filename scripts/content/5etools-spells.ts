import type { SpellData, SpellText } from '@shared/systems/dnd5e/content/spell.schema';

/*
 * Converts 5etools spells (data/spells/*.json) to the content format (content/dnd5e/<source>/).
 * Only the fields the conversion reads are typed.
 */

type Entry = string | { type: string; name?: string; [key: string]: unknown };

export interface FiveToolsSpell {
  name: string;
  source: string;
  /** `true`, or the spell's name in the SRD when the book's differs ("Melf's Acid Arrow"). */
  srd52?: boolean | string;
  /** The same for the SRD 5.1, on the 2014 book's spells (spells-phb.json). */
  srd?: boolean | string;
  level: number;
  school: string;
  time: { number: number; unit: string; condition?: string }[];
  range: { type: string; distance?: { type: string; amount?: number } };
  components: { v?: boolean; s?: boolean; m?: string | { text: string; cost?: number } };
  duration: {
    type: string;
    duration?: { type: string; amount?: number };
    concentration?: boolean;
  }[];
  meta?: { ritual?: boolean };
  entries: Entry[];
  entriesHigherLevel?: { type: string; name?: string; entries: Entry[] }[];
  damageInflict?: string[];
}

const SCHOOLS: Record<string, string> = {
  A: 'abjuration',
  C: 'conjuration',
  D: 'divination',
  E: 'enchantment',
  V: 'evocation',
  I: 'illusion',
  N: 'necromancy',
  T: 'transmutation',
};

const CASTING_TIMES: Record<string, string> = { bonus: 'bonus_action' };
const POINT_RANGES = new Set(['self', 'touch', 'sight', 'unlimited']);
const DISTANCES: Record<string, string> = { feet: 'feet', miles: 'mile' };
const DURATIONS: Record<string, string> = {
  instant: 'instantaneous',
  permanent: 'special',
  special: 'special',
};

/** The spell's name in the SRD, which can differ from the book's. */
const srdName = (spell: FiveToolsSpell) =>
  typeof spell.srd52 === 'string'
    ? spell.srd52
    : !spell.srd52 && typeof spell.srd === 'string'
      ? spell.srd
      : spell.name;

export const toSpellId = (spell: FiveToolsSpell) =>
  srdName(spell)
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function extraCastingTimesOf(extraTimes: FiveToolsSpell['time']) {
  if (!extraTimes.length) return {};
  return {
    extraCastingTimes: extraTimes.map((extra) => ({
      castingTime: CASTING_TIMES[extra.unit] ?? extra.unit,
      castingValue: extra.number,
    })),
  };
}

function triggerOf(spell: FiveToolsSpell) {
  const condition = spell.time[0].condition;
  return condition ? { trigger: stripTags(condition) } : {};
}

/** Range: a distance, a named one (touch, self…), or an area around the caster, which is "self". */
function toRange({ type, distance }: FiveToolsSpell['range']) {
  if (type === 'point' && distance) {
    if (POINT_RANGES.has(distance.type)) return { rangeUnit: distance.type, rangeValue: null };
    const unit = DISTANCES[distance.type];
    if (unit) return { rangeUnit: unit, rangeValue: distance.amount ?? null };
  }
  if (type === 'special') return { rangeUnit: 'special', rangeValue: null };
  return { rangeUnit: 'self', rangeValue: null };
}

function toDuration([duration]: FiveToolsSpell['duration']) {
  if (duration.type === 'timed' && duration.duration) {
    return {
      durationUnit: duration.duration.type,
      durationValue: duration.duration.amount ?? null,
    };
  }
  return { durationUnit: DURATIONS[duration.type] ?? 'special', durationValue: null };
}

/**
 * Rules data. `previous` is the same spell in the SRD 5.1, whose look (category, background) and
 * damage type are ours and carry over; a new spell gets the look 5.1 spells with or without
 * damage have.
 */
export function toSpellData(
  spell: FiveToolsSpell,
  classes: string[],
  previous?: SpellData,
): SpellData {
  const [time, ...extraTimes] = spell.time;
  const { m } = spell.components;
  const damage = spell.damageInflict ?? [];
  // 5etools lists every damage a spell mentions, in alphabetical order (Web: the burning webs →
  // fire). Ours is the spell's main damage, curated for 5.1: a 5.1 spell without one stays without
  const damageType = !previous
    ? (damage[0] ?? null)
    : previous.damageType && !damage.includes(previous.damageType)
      ? (damage[0] ?? null)
      : previous.damageType;

  return {
    id: toSpellId(spell),
    level: spell.level,
    school: SCHOOLS[spell.school],
    classes,
    components: [
      ...(spell.components.v ? (['V'] as const) : []),
      ...(spell.components.s ? (['S'] as const) : []),
      ...(m ? (['M'] as const) : []),
    ],
    castingTime: CASTING_TIMES[time.unit] ?? time.unit,
    castingValue: time.number,
    ...extraCastingTimesOf(extraTimes),
    ...toRange(spell.range),
    ...toDuration(spell.duration),
    concentration: spell.duration.some((d) => d.concentration),
    ritual: Boolean(spell.meta?.ritual),
    isScaling: false,
    // 5etools prices in copper pieces
    materialCost: typeof m === 'object' && m.cost ? Math.floor(m.cost / 100) : 0,
    damageType,
    spellCategory: previous?.spellCategory ?? 'utility',
    bgStyleId: previous?.bgStyleId ?? (damageType ? 'grid-mesh' : 'dots-space'),
  };
}

/** `{@tag text|source|display}` → what 5etools shows: the display text, or else the text. */
export function stripTags(text: string): string {
  let previous: string;
  let current = text;
  // Tags can nest ({@b {@dice 1d6}}): strip the innermost first, until none is left
  do {
    previous = current;
    current = current.replace(/\{@(\w+)\s*([^{}]*)\}/g, (_, tag: string, body: string) => {
      const parts = body.split('|');
      if (tag === 'chance') return `${parts[0]}%`;
      if (tag === 'dc') return `DC ${parts[0]}`;
      // The third part of these is a filter or a chapter, not display text
      if (tag === 'filter' || tag === 'book' || tag === 'adventure') return parts[0];
      if (tag === 'scaledamage' || tag === 'scaledice') return parts[2] ?? parts[0];
      return parts[2] || parts[0];
    });
  } while (current !== previous);
  return current;
}

function renderEntry(entry: Entry): string[] {
  if (typeof entry === 'string') return [stripTags(entry)];
  const children = (entry.entries as Entry[] | undefined) ?? [];
  switch (entry.type) {
    case 'list':
      return (entry.items as Entry[]).map((item) => `• ${renderEntry(item).join(' ')}`);
    case 'table': {
      const rows = [entry.colLabels as string[] | undefined, ...(entry.rows as string[][])];
      const lines = rows
        .filter((row) => row !== undefined)
        .map((row) => row.map(stripTags).join(' | '));
      // Spells name their tables ("consult the Prismatic Rays table")
      return entry.caption ? [stripTags(entry.caption as string), ...lines] : lines;
    }
    default: {
      // `entries`, `item`…: a titled block, the title in front of its first paragraph
      const lines = children.flatMap(renderEntry);
      if (entry.name && lines.length) lines[0] = `${stripTags(entry.name)}. ${lines[0]}`;
      return lines;
    }
  }
}

/** Plain text, one paragraph per line, as the SRD 5.1 texts are. */
export const renderEntries = (entries: Entry[]) => entries.flatMap(renderEntry).join('\n');

const sentence = (text: string) => {
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
};

export function toSpellText(spell: FiveToolsSpell): SpellText {
  const { m } = spell.components;
  const material = typeof m === 'object' ? m.text : m;
  // The higher-level block's title ("Using a Higher-Level Spell Slot") is the card's own label
  const higherLevel = spell.entriesHigherLevel
    ?.flatMap((block) => block.entries.flatMap(renderEntry))
    .join('\n');

  return {
    name: srdName(spell),
    description: renderEntries(spell.entries),
    ...(higherLevel ? { higherLevel } : {}),
    ...(material ? { material: sentence(stripTags(material)) } : {}),
    ...triggerOf(spell),
  };
}

/**
 * What the 2014 spells (SRD 5.1, converted from another source before 5etools) still lack: the
 * other casting times and the reaction's or bonus action's trigger.
 */
export function extrasOf(
  spell: FiveToolsSpell,
): Pick<SpellData, 'extraCastingTimes'> & Pick<SpellText, 'trigger'> {
  return { ...extraCastingTimesOf(spell.time.slice(1)), ...triggerOf(spell) };
}
