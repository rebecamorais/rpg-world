import { type ClassChoiceSelections, acceptedSelections } from './class-choices';
import type { ClassDefaults } from './class-defaults';
import type { ClassFeature } from './content/class.schema';

/*
 * Armor, weapon and tool proficiencies and languages (docs/plans/2026-11-15-criacao-com-classe.md,
 * 3.2). Same contract as the saving throws: what the class, its SRD subclass or one of its features
 * gives is computed here and never stored. The sheet stores only what the player changed: what was
 * added from the lists (by id), their own text (as typed) and what was given and turned off. The
 * tools picked for the class's own choices (3.3) are read from the sheet's `classChoices`.
 */

export const PROFICIENCY_KINDS = ['armor', 'weapons', 'tools', 'languages'] as const;
export type ProficiencyKind = (typeof PROFICIENCY_KINDS)[number];

/** Armor proficiencies come by category, as the class data has them. */
export const ARMOR_IDS = ['light', 'medium', 'heavy', 'shield'] as const;
/** Weapon categories; a single weapon is the id of a weapon in the book's items. */
export const WEAPON_CATEGORY_IDS = ['simple', 'martial'] as const;

/** What the sheet stores for one kind. Every list is optional, and absent means empty. */
interface SavedProficiencyList {
  /** Picked from the lists: ids, never names. */
  added?: string[];
  /** The player's own, as typed (after "Other…"). */
  own?: string[];
  /** Ids the class, subclass or a feature gives, or picked for a class choice, turned off by hand.
   *  Like a saving throw set to "not proficient", it holds in any class. */
  off?: string[];
}

export type SavedProficiencies = Partial<Record<ProficiencyKind, SavedProficiencyList>>;

/**
 * Where an effective proficiency comes from. `feature` is the id of the feature that gives it.
 * `classChoice`: picked for one of the class's choices (`choice` is its identity, `2014/bard/tools`).
 * `chosen`: added by the player from the lists, on the sheet.
 */
type ProficiencyOrigin =
  | { type: 'class' }
  | { type: 'subclass'; feature: string }
  | { type: 'feature'; feature: string }
  | { type: 'classChoice'; choice: string }
  | { type: 'chosen' }
  | { type: 'own' };

export interface EffectiveProficiency {
  kind: ProficiencyKind;
  /** The id in its list; absent on the player's own text. */
  id?: string;
  /** Only on the player's own: their text, as typed. */
  text?: string;
  origin: ProficiencyOrigin;
  /** False on one that is given and turned off: still listed, so it can be turned back on. */
  active: boolean;
}

interface FeatureGrant {
  /** The feature that gives it, in the class (or in the subclass, for `SUBCLASS_GRANTS`). */
  feature: string;
  kind: ProficiencyKind;
  id: string;
}

/*
 * SRD 5.1 features that give a proficiency or a language beyond the class's own list. The content
 * files keep these only in the feature's text, so they are listed here by id; the level comes from
 * the content, so the grant starts when the feature does. A test checks every feature exists.
 */
export const FEATURE_GRANTS: Record<string, FeatureGrant[]> = {
  druid: [{ feature: 'druidic', kind: 'languages', id: 'druidic' }],
  rogue: [{ feature: 'thieves-cant', kind: 'languages', id: 'thieves-cant' }],
};

/** By `<class>/<subclass>`: only when the sheet has that SRD subclass. */
export const SUBCLASS_GRANTS: Record<string, FeatureGrant[]> = {
  'cleric/life': [{ feature: 'life-domain', kind: 'armor', id: 'heavy' }],
};

type Feature = Pick<ClassFeature, 'id' | 'level'>;

interface ProficiencyInput {
  /** What the class gives (`classDefaults`); null when the sheet does not follow a class. */
  defaults: Pick<ClassDefaults, 'armor' | 'weapons' | 'tools' | 'choices'> | null;
  /** The class content, for its features and its SRD subclass. */
  content: {
    classId: string;
    features: Feature[];
    subclass: { id: string };
    subclassFeatures: Feature[];
  } | null;
  level: number;
  /** The SRD subclass the sheet has (`matchSubclass`), or null. */
  subclassId: string | null;
  /**
   * The sheet's picks for class choices, by identity (`classChoices`). Only the current class's
   * tool choices count, and only their valid picks: those of another class stay saved, unshown.
   */
  classChoices?: ClassChoiceSelections;
}

interface Grant {
  kind: ProficiencyKind;
  id: string;
  origin: ProficiencyOrigin;
}

/** The tools picked for the class's tool choices, as they count (`acceptedSelections`). */
function picked(defaults: Pick<ClassDefaults, 'choices'>, saved?: ClassChoiceSelections): Grant[] {
  const toolChoices = defaults.choices.filter((choice) => choice.kind === 'tools');
  return Object.entries(acceptedSelections(toolChoices, saved)).flatMap(([choice, ids]) =>
    ids.map((id) => ({ kind: 'tools' as const, id, origin: { type: 'classChoice', choice } })),
  );
}

/**
 * What the class, its subclass and its features give at this level, and the tools picked for the
 * class's choices, before the player's changes.
 */
function grants({ defaults, content, level, subclassId, classChoices }: ProficiencyInput): Grant[] {
  if (!defaults) return [];
  const fromClass: Grant[] = [
    ...defaults.armor.map((id) => ({ kind: 'armor' as const, id })),
    ...defaults.weapons.map((id) => ({ kind: 'weapons' as const, id })),
    ...defaults.tools.map((id) => ({ kind: 'tools' as const, id })),
  ].map((grant) => ({ ...grant, origin: { type: 'class' } }));
  const fromChoices = picked(defaults, classChoices);
  if (!content) return [...fromClass, ...fromChoices];

  const reached = (features: Feature[], feature: string) =>
    features.some((f) => f.id === feature && f.level <= level);
  const hasSubclass = subclassId !== null && subclassId === content.subclass.id;

  const fromSubclass: Grant[] = hasSubclass
    ? (SUBCLASS_GRANTS[`${content.classId}/${content.subclass.id}`] ?? [])
        .filter((grant) => reached(content.subclassFeatures, grant.feature))
        .map(({ kind, id, feature }) => ({ kind, id, origin: { type: 'subclass', feature } }))
    : [];
  const fromFeatures: Grant[] = (FEATURE_GRANTS[content.classId] ?? [])
    .filter((grant) => reached(content.features, grant.feature))
    .map(({ kind, id, feature }) => ({ kind, id, origin: { type: 'feature', feature } }));

  return [...fromClass, ...fromSubclass, ...fromFeatures, ...fromChoices];
}

/**
 * Every proficiency and language the sheet shows, by kind, each with where it comes from: what the
 * class, the SRD subclass and the class's features give and the tools picked for the class's
 * choices (the ones turned off too, marked inactive), then what the player added from the lists,
 * then their own text. Each id shows once: the first origin wins, so something the class gives
 * and the player also added shows as the class's.
 */
export function effectiveProficiencies(
  saved: SavedProficiencies | undefined,
  input: ProficiencyInput,
): Record<ProficiencyKind, EffectiveProficiency[]> {
  const result: Record<ProficiencyKind, EffectiveProficiency[]> = {
    armor: [],
    weapons: [],
    tools: [],
    languages: [],
  };
  const seen = new Set<string>();
  const once = (kind: ProficiencyKind, value: string) => {
    const key = `${kind}:${value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };

  for (const { kind, id, origin } of grants(input)) {
    if (!once(kind, id)) continue;
    result[kind].push({ kind, id, origin, active: !saved?.[kind]?.off?.includes(id) });
  }
  for (const kind of PROFICIENCY_KINDS) {
    for (const id of saved?.[kind]?.added ?? []) {
      if (once(kind, id)) result[kind].push({ kind, id, origin: { type: 'chosen' }, active: true });
    }
    const own = new Set<string>();
    for (const text of saved?.[kind]?.own ?? []) {
      const trimmed = text.trim();
      if (!trimmed || own.has(trimmed)) continue;
      own.add(trimmed);
      result[kind].push({ kind, text: trimmed, origin: { type: 'own' }, active: true });
    }
  }
  return result;
}

/* Edits, as the sheet makes them. Each returns the whole map, without empty lists left behind. */

function edit(
  saved: SavedProficiencies | undefined,
  kind: ProficiencyKind,
  change: (list: Required<SavedProficiencyList>) => SavedProficiencyList,
): SavedProficiencies {
  const current = saved?.[kind];
  const next = change({
    added: current?.added ?? [],
    own: current?.own ?? [],
    off: current?.off ?? [],
  });
  const list = Object.fromEntries(
    Object.entries(next).filter(([, values]) => values && values.length > 0),
  ) as SavedProficiencyList;
  const { [kind]: _, ...others } = saved ?? {};
  return Object.keys(list).length > 0 ? { ...others, [kind]: list } : others;
}

const without = (values: string[], value: string) => values.filter((v) => v !== value);

/** Adds one from the list, by id. One that is given and was turned off comes back on. */
export const addProficiency = (
  saved: SavedProficiencies | undefined,
  kind: ProficiencyKind,
  id: string,
) =>
  edit(saved, kind, ({ added, own, off }) => ({
    added: added.includes(id) ? added : [...added, id],
    own,
    off: without(off, id),
  }));

/** Adds the player's own text, as typed (only the spaces around it go). */
export const addOwnProficiency = (
  saved: SavedProficiencies | undefined,
  kind: ProficiencyKind,
  text: string,
) => {
  const trimmed = text.trim();
  return edit(saved, kind, ({ added, own, off }) => ({
    added,
    own: !trimmed || own.includes(trimmed) ? own : [...own, trimmed],
    off,
  }));
};

/**
 * Takes one off the sheet: one the player added or wrote is removed; one the class, subclass or a
 * feature gives, or one picked for a class choice, is turned off (kept as off, so it can be turned
 * back on). The pick itself stays in `classChoices`: turning it off is not unpicking it.
 */
export const removeProficiency = (
  saved: SavedProficiencies | undefined,
  entry: Pick<EffectiveProficiency, 'kind' | 'id' | 'text' | 'origin'>,
) =>
  edit(saved, entry.kind, ({ added, own, off }) => {
    const { type } = entry.origin;
    if (type === 'own') return { added, own: without(own, entry.text ?? ''), off };
    const id = entry.id ?? '';
    if (type === 'chosen') return { added: without(added, id), own, off };
    return { added, own, off: off.includes(id) ? off : [...off, id] };
  });

/** One the class, subclass or a feature gives, or picked for a class choice, turned back on. */
export const restoreProficiency = (
  saved: SavedProficiencies | undefined,
  kind: ProficiencyKind,
  id: string,
) => edit(saved, kind, ({ added, own, off }) => ({ added, own, off: without(off, id) }));
