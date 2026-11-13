import { contentIdFromName } from '@shared/content/content-key';
import { stripTags } from '@shared/content/tags';
import type {
  ClassChoice,
  ClassData,
  ClassFeature,
  ClassProficiencies,
  ClassResource,
  ClassText,
  ResourceMax,
  Steps,
} from '@shared/systems/dnd5e/content/class.schema';

import { type Entry, renderEntries } from './5etools-spells';

/*
 * Converts 5etools classes (data/class/class-<name>.json) to the content format.
 * Only the fields the conversion reads are typed.
 */

type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/** A cell of the class table: a number, a text ("Unlimited", a tagged "1st"), a die or a bonus. */
type TableCell =
  | number
  | string
  | { type: 'dice'; toRoll: { number: number; faces: number }[] }
  | { type: 'bonus' | 'bonusSpeed'; value: number };

type Progression = number[] | Record<string, number>;

export interface FiveToolsClass {
  name: string;
  source: string;
  srd?: boolean;
  srd52?: boolean;
  hd: { number: number; faces: number };
  /** Saving throw proficiencies. */
  proficiency: Ability[];
  spellcastingAbility?: Ability;
  /** `full`, `1/2`, `artificer` (half, rounded up) or `pact`. */
  casterProgression?: string;
  startingProficiencies: {
    armor?: (string | { proficiency: string; full: string })[];
    armorProficiencies?: Record<string, boolean>[];
    weapons?: string[];
    weaponProficiencies?: { all?: { fromFilter: string } }[];
    /** Alternatives: one of these objects. */
    toolProficiencies?: Record<string, boolean | number>[];
    skills: ({ choose: { from: string[]; count: number } } | { any: number })[];
  };
  classTableGroups?: { title?: string; colLabels: string[]; rows?: TableCell[][] }[];
  /** `Name|Class|ClassSource|Level|Source`, or an object when it gives a subclass feature. */
  classFeatures: (string | { classFeature: string; gainSubclassFeature?: boolean })[];
  optionalfeatureProgression?: { name: string; featureType: string[]; progression: Progression }[];
  featProgression?: { name: string; category: string[]; progression: Progression }[];
  subclassTitle: string;
}

interface FiveToolsSubclass {
  name: string;
  shortName: string;
  source: string;
  className: string;
  classSource: string;
  srd?: boolean;
  srd52?: boolean;
  /** `Name|Class|ClassSource|SubclassShortName|SubclassSource|Level|Source`. */
  subclassFeatures: string[];
}

export interface FiveToolsFeature {
  name: string;
  source: string;
  className: string;
  classSource: string;
  subclassShortName?: string;
  subclassSource?: string;
  level: number;
  srd?: boolean;
  srd52?: boolean;
  entries: Entry[];
}

/** One class-<name>.json file. */
export interface FiveToolsClassFile {
  class: FiveToolsClass[];
  subclass?: FiveToolsSubclass[];
  classFeature: FiveToolsFeature[];
  subclassFeature?: FiveToolsFeature[];
}

/** The SRD books the classes are imported for: content folder -> 5etools source and SRD flag. */
const BOOKS = {
  'srd-5.1': { source: 'PHB', flag: 'srd' },
  'srd-5.2': { source: 'XPHB', flag: 'srd52' },
} as const;

export type ClassBook = keyof typeof BOOKS;

export interface ClassContext {
  book: ClassBook;
  file: FiveToolsClassFile;
  /** Whether an optional feature (Metamagic…) or a feat a feature lists is in this book's SRD. */
  inSrd: (kind: 'optionalfeature' | 'feat', name: string, source: string) => boolean;
}

/** What 5etools can't say: a resource's maximum and recovery, written from the rules text. */
export interface ResourceSpec {
  id: string;
  name: string;
  note?: string;
  /** Id of the feature that grants it (see `withIds`). */
  feature: string;
  /** Defaults to the feature's level. */
  level?: number;
  unit: ClassResource['unit'];
  /** `column`: from the class table, e.g. `Rages`. */
  max: ResourceMax | { column: string };
  recovery: ClassResource['recovery'];
  die?: NonNullable<ClassResource['die']> | { column: string };
  spellLevel?: Steps<number> | { column: string };
}

export interface ResourceSpecs {
  class: ResourceSpec[];
  subclass: ResourceSpec[];
}

const isSrd = (item: { srd?: boolean; srd52?: boolean }, book: ClassBook) =>
  item[BOOKS[book].flag] === true;

export const isSrdClass = (c: FiveToolsClass, book: ClassBook) =>
  c.source === BOOKS[book].source && isSrd(c, book);

export const toClassId = (c: FiveToolsClass) => contentIdFromName(c.name);

// --- Features -----------------------------------------------------------------------------------

/** Finds the feature a `classFeatures` or `refClassFeature` reference points to. */
function findClassFeature(file: FiveToolsClassFile, ref: string): FiveToolsFeature {
  const [name, className, classSource = '', level, source = ''] = ref.split('|');
  const cs = classSource || 'PHB';
  const found = file.classFeature.find(
    (f) =>
      f.name === name &&
      f.className === className &&
      f.classSource === cs &&
      f.level === Number(level) &&
      f.source === (source || cs),
  );
  if (!found) throw new Error(`class feature not found: ${ref}`);
  return found;
}

/** Finds the feature a `subclassFeatures` or `refSubclassFeature` reference points to. */
function findSubclassFeature(file: FiveToolsClassFile, ref: string): FiveToolsFeature {
  const [name, className, classSource, shortName, subclassSource, level, source] = ref.split('|');
  const cs = classSource || 'PHB';
  const ss = subclassSource || 'PHB';
  const found = (file.subclassFeature ?? []).find(
    (f) =>
      f.name === name &&
      f.className === className &&
      f.classSource === cs &&
      f.subclassShortName === shortName &&
      f.subclassSource === ss &&
      f.level === Number(level) &&
      f.source === (source || ss),
  );
  if (!found) throw new Error(`subclass feature not found: ${ref}`);
  return found;
}

const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

const abilityNames = (attributes: unknown) =>
  (attributes as Ability[]).map((a) => ABILITY_NAMES[a]).join(' or ');

/**
 * Rewrites what the spells' renderer doesn't know into what it does: a referenced feature becomes
 * a titled block (only if it is in the SRD), a listed option or feat a tag, a DC formula a line.
 * `nested` collects the features shown inside another one.
 */
function expand(entry: Entry, ctx: ClassContext, nested: Set<FiveToolsFeature>): Entry[] {
  if (typeof entry === 'string') return [entry];
  const children = (list: unknown) => (list as Entry[]).flatMap((e) => expand(e, ctx, nested));
  const titled = (feature: FiveToolsFeature): Entry[] => {
    if (!isSrd(feature, ctx.book)) return [];
    nested.add(feature);
    return [{ type: 'entries', name: feature.name, entries: children(feature.entries) }];
  };

  switch (entry.type) {
    case 'refClassFeature':
      return titled(findClassFeature(ctx.file, entry.classFeature as string));
    case 'refSubclassFeature':
      return titled(findSubclassFeature(ctx.file, entry.subclassFeature as string));
    case 'refOptionalfeature': {
      const [name, source = 'PHB'] = (entry.optionalfeature as string).split('|');
      return ctx.inSrd('optionalfeature', name, source)
        ? [`• {@optfeature ${name}|${source}}`]
        : [];
    }
    case 'refFeat': {
      const [name, source = 'PHB'] = (entry.feat as string).split('|');
      return ctx.inSrd('feat', name, source) ? [`• {@feat ${name}|${source}}`] : [];
    }
    case 'abilityDc':
      return [
        `${entry.name} save DC = 8 + your proficiency bonus + your ${abilityNames(entry.attributes)} modifier`,
      ];
    case 'abilityAttackMod':
      return [
        `${entry.name} attack modifier = your proficiency bonus + your ${abilityNames(entry.attributes)} modifier`,
      ];
    case 'list':
      return [{ ...entry, items: children(entry.items) }];
    case 'table': {
      const rows = entry.rows as unknown[][];
      if (!rows.flat().every((cell) => typeof cell === 'string')) {
        throw new Error(`table "${String(entry.caption)}" has cells that aren't text`);
      }
      return [entry];
    }
    case 'entries':
    case 'inset':
    case 'options':
    case 'item':
      return [{ ...entry, entries: children(entry.entries ?? (entry.entry ? [entry.entry] : [])) }];
    default:
      throw new Error(`entry type the importer doesn't know: ${entry.type}`);
  }
}

/** Ids from the names; a name that repeats (Ability Score Improvement) gets its level after it. */
export function withIds<T extends { name: string; level: number }>(
  features: T[],
): (T & { id: string })[] {
  const count = new Map<string, number>();
  for (const f of features) {
    const id = contentIdFromName(f.name);
    count.set(id, (count.get(id) ?? 0) + 1);
  }
  const withId = features.map((f) => {
    const id = contentIdFromName(f.name);
    return { ...f, id: count.get(id)! > 1 ? `${id}-${f.level}` : id };
  });
  const ids = withId.map((f) => f.id);
  const repeated = ids.find((id, i) => ids.indexOf(id) !== i);
  if (repeated) throw new Error(`two features with id "${repeated}"`);
  return withId;
}

interface ListedFeature {
  feature: FiveToolsFeature;
  gainsSubclassFeature: boolean;
}

/** Feature data and texts, in the order 5etools lists them; features outside the SRD are left out. */
function convertFeatures(listed: ListedFeature[], ctx: ClassContext) {
  const srd = listed.filter(({ feature }) => isSrd(feature, ctx.book));
  const nested = new Set<FiveToolsFeature>();
  const converted = withIds(
    srd.map(({ feature, gainsSubclassFeature }) => ({
      name: feature.name,
      level: feature.level,
      gainsSubclassFeature,
      description: renderEntries(feature.entries.flatMap((e) => expand(e, ctx, nested))),
    })),
  );
  // A feature shown inside another one would be there twice
  const twice = srd.filter(({ feature }) => nested.has(feature));
  if (twice.length) throw new Error(`listed and nested: ${twice.map((f) => f.feature.name)}`);

  const data: ClassFeature[] = converted.map(({ id, level, gainsSubclassFeature }) =>
    gainsSubclassFeature ? { id, level, gainsSubclassFeature: true } : { id, level },
  );
  const texts = Object.fromEntries(
    converted.map(({ id, name, description }) => [id, { name, description }]),
  );
  return { data, texts };
}

// --- Class table --------------------------------------------------------------------------------

const ORDINAL = /^(\d+)(st|nd|rd|th)$/;

/** A table cell as a number; `null` for "Unlimited". */
export function cellValue(cell: TableCell): number | null {
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    const text = stripTags(cell).trim();
    if (/^unlimited$/i.test(text)) return null;
    if (/^\d+$/.test(text)) return Number(text);
    const ordinal = ORDINAL.exec(text);
    if (ordinal) return Number(ordinal[1]);
  } else if (cell.type === 'dice' && cell.toRoll.length === 1 && cell.toRoll[0].number === 1) {
    return cell.toRoll[0].faces;
  } else if (cell.type === 'bonus' || cell.type === 'bonusSpeed') {
    return cell.value;
  }
  throw new Error(`table cell the importer doesn't know: ${JSON.stringify(cell)}`);
}

/** One value per class level -> the levels where it changes, without the leading zeros. */
export function toSteps<T>(values: T[]): Steps<T> {
  const steps: Steps<T> = [];
  values.forEach((value, i) => {
    if (steps.length === 0 && value === 0) return;
    if (steps.length === 0 || steps[steps.length - 1].value !== value) {
      steps.push({ level: i + 1, value });
    }
  });
  return steps;
}

/** The steps of a column of the class table, found by its label (tags stripped). */
function columnSteps(c: FiveToolsClass, label: string): Steps<number | null> {
  for (const group of c.classTableGroups ?? []) {
    const index = group.colLabels.findIndex((l) => stripTags(l) === label);
    if (index >= 0 && group.rows) return toSteps(group.rows.map((row) => cellValue(row[index])));
  }
  throw new Error(`${c.name} (${c.source}): no table column "${label}"`);
}

// --- Proficiencies, spellcasting, choices -------------------------------------------------------

const ARMOR = ['light', 'medium', 'heavy', 'shield'] as const;
const WEAPON_PROPERTIES: Record<string, string> = { finesse: 'F', light: 'L' };
const TOOL_KINDS: Record<string, 'artisan-tools' | 'musical-instrument'> = {
  anyArtisansTool: 'artisan-tools',
  anyMusicalInstrument: 'musical-instrument',
};
const SKILLS = [
  'acrobatics',
  'animal handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight of hand',
  'stealth',
  'survival',
];

const skillKey = (skill: string) =>
  skill.toUpperCase().replace(/ /g, '_') as ClassProficiencies['skills']['from'][number];
const upper = (ability: Ability) => ability.toUpperCase() as ClassProficiencies['savingThrows'][0];

function toWeapons(p: FiveToolsClass['startingProficiencies']) {
  const weapons: string[] = [];
  let properties: string[] | undefined;
  for (const weapon of p.weapons ?? []) {
    const item = /^\{@item ([^|}]+)/.exec(weapon);
    if (weapon === 'simple' || weapon === 'martial') weapons.push(weapon);
    else if (item) weapons.push(contentIdFromName(item[1]));
    else {
      // "Martial weapons that have the Light property": the filter says which properties
      const filter = p.weaponProficiencies?.find((w) => w.all)?.all?.fromFilter ?? '';
      const names = /property=([a-z;]+)/.exec(filter)?.[1].split(';') ?? [];
      properties = names.map((name) => WEAPON_PROPERTIES[name]).sort();
      if (!properties.length || properties.includes(undefined as never)) {
        throw new Error(`weapon proficiency the importer doesn't know: ${weapon}`);
      }
    }
  }
  return properties ? { weapons, martialWeaponsWithProperty: properties } : { weapons };
}

function toTools(p: FiveToolsClass['startingProficiencies']) {
  const alternatives = p.toolProficiencies ?? [];
  const tools: string[] = [];
  const kinds: ('artisan-tools' | 'musical-instrument')[] = [];
  const counts = new Set<number>();
  for (const alternative of alternatives) {
    for (const [key, value] of Object.entries(alternative)) {
      if (TOOL_KINDS[key] && typeof value === 'number') {
        kinds.push(TOOL_KINDS[key]);
        counts.add(value);
      } else if (value === true && alternatives.length === 1) {
        tools.push(contentIdFromName(key));
      } else {
        throw new Error(`tool proficiency the importer doesn't know: ${key}`);
      }
    }
  }
  if (counts.size > 1) throw new Error(`tool choices with different counts: ${[...counts]}`);
  return kinds.length ? { tools, toolChoice: { count: [...counts][0], from: kinds } } : { tools };
}

export function toProficiencies(c: FiveToolsClass): ClassProficiencies {
  const p = c.startingProficiencies;
  const armor = p.armorProficiencies?.[0] ?? {};
  const [skills] = p.skills;
  return {
    savingThrows: c.proficiency.map(upper),
    armor: ARMOR.filter((a) => armor[a]),
    ...toWeapons(p),
    ...toTools(p),
    skills:
      'any' in skills
        ? { count: skills.any, from: SKILLS.map(skillKey) }
        : { count: skills.choose.count, from: skills.choose.from.map(skillKey) },
  };
}

const PROGRESSIONS: Record<string, NonNullable<ClassData['spellcasting']>['progression']> = {
  full: 'full',
  '1/2': 'half',
  artificer: 'half-round-up',
  pact: 'pact',
};

function toSpellcasting(c: FiveToolsClass): Pick<ClassData, 'spellcasting'> {
  if (!c.spellcastingAbility) return {};
  const progression = PROGRESSIONS[c.casterProgression ?? ''];
  if (!progression) throw new Error(`${c.name}: caster progression ${c.casterProgression}`);
  return { spellcasting: { ability: upper(c.spellcastingAbility), progression } };
}

/** By level (an array of 20) or as the total at the levels where it changes. */
const progressionSteps = (progression: Progression): Steps<number> =>
  Array.isArray(progression)
    ? toSteps(progression)
    : Object.entries(progression)
        .map(([level, value]) => ({ level: Number(level), value }))
        .sort((a, b) => a.level - b.level);

function toChoices(c: FiveToolsClass) {
  const choices = [
    ...(c.optionalfeatureProgression ?? []).map((p) => ({
      name: p.name,
      kind: 'optional-feature' as const,
      categories: p.featureType,
      count: progressionSteps(p.progression),
    })),
    ...(c.featProgression ?? []).map((p) => ({
      name: p.name,
      kind: 'feat' as const,
      categories: p.category,
      count: progressionSteps(p.progression),
    })),
  ].map((choice) => ({ ...choice, id: contentIdFromName(choice.name) }));
  const data: ClassChoice[] = choices.map(({ id, kind, categories, count }) => ({
    id,
    kind,
    categories,
    count,
  }));
  return { data, texts: Object.fromEntries(choices.map(({ id, name }) => [id, { name }])) };
}

// --- Resources ----------------------------------------------------------------------------------

const fromColumn = <T>(c: FiveToolsClass, value: T | { column: string }) =>
  typeof value === 'object' && value !== null && 'column' in value
    ? columnSteps(c, value.column)
    : value;

export function toResource(
  spec: ResourceSpec,
  c: FiveToolsClass,
  features: ClassFeature[],
): ClassResource {
  const feature = features.find((f) => f.id === spec.feature);
  if (!feature) throw new Error(`${c.name}, ${spec.id}: no feature "${spec.feature}"`);
  const level = spec.level ?? feature.level;
  const max: ResourceMax =
    'column' in spec.max ? { type: 'steps', steps: columnSteps(c, spec.max.column) } : spec.max;
  if (max.type === 'steps' && max.steps[0].level !== level) {
    throw new Error(
      `${c.name}, ${spec.id}: gained at ${level}, the maximum starts at ${max.steps[0].level}`,
    );
  }
  const die = spec.die && (fromColumn(c, spec.die) as ClassResource['die']);
  const spellLevel = spec.spellLevel && (fromColumn(c, spec.spellLevel) as Steps<number>);
  return {
    id: spec.id,
    feature: spec.feature,
    level,
    unit: spec.unit,
    max,
    recovery: spec.recovery,
    ...(die ? { die } : {}),
    ...(spellLevel ? { spellLevel } : {}),
  };
}

const resourceTexts = (specs: ResourceSpec[]) =>
  Object.fromEntries(
    specs.map(({ id, name, note }) => [id, note ? { name, note } : { name }]),
  ) as ClassText['resources'];

// --- Class --------------------------------------------------------------------------------------

/** The class with its SRD subclass, and their English texts. */
export function toClass(
  c: FiveToolsClass,
  ctx: ClassContext,
  specs: ResourceSpecs,
): { data: ClassData; text: ClassText } {
  const features = convertFeatures(
    c.classFeatures.map((ref) =>
      typeof ref === 'string'
        ? { feature: findClassFeature(ctx.file, ref), gainsSubclassFeature: false }
        : {
            feature: findClassFeature(ctx.file, ref.classFeature),
            gainsSubclassFeature: Boolean(ref.gainSubclassFeature),
          },
    ),
    ctx,
  );
  const subclasses = (ctx.file.subclass ?? [])
    .filter((s) => s.className === c.name && s.classSource === c.source && isSrd(s, ctx.book))
    .map((s) => {
      const converted = convertFeatures(
        s.subclassFeatures.map((ref) => ({
          feature: findSubclassFeature(ctx.file, ref),
          gainsSubclassFeature: false,
        })),
        ctx,
      );
      return {
        id: contentIdFromName(s.shortName),
        name: s.name,
        features: converted,
        resources: specs.subclass.map((spec) => toResource(spec, c, converted.data)),
      };
    });
  if (subclasses.length !== 1) {
    throw new Error(`${c.name}: ${subclasses.length} SRD subclasses, expected 1`);
  }
  const choices = toChoices(c);

  const data: ClassData = {
    id: toClassId(c),
    hitDie: c.hd.faces as ClassData['hitDie'],
    proficiencies: toProficiencies(c),
    ...toSpellcasting(c),
    features: features.data,
    resources: specs.class.map((spec) => toResource(spec, c, features.data)),
    choices: choices.data,
    subclasses: subclasses.map((s) => ({
      id: s.id,
      features: s.features.data,
      resources: s.resources,
    })),
  };
  const text: ClassText = {
    name: c.name,
    subclassTitle: c.subclassTitle,
    features: features.texts,
    resources: resourceTexts(specs.class),
    choices: choices.texts,
    subclasses: Object.fromEntries(
      subclasses.map((s) => [
        s.id,
        { name: s.name, features: s.features.texts, resources: resourceTexts(specs.subclass) },
      ]),
    ),
  };
  return { data, text };
}
