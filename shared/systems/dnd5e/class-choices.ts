import type { ClassDefaults } from './class-defaults';

/*
 * What the player picked for a class's level 1 choices (skills, tools), and which of those picks
 * count. Picks are kept by the choice's identity (`2014/bard/skills`), so the picks for one class
 * never count for another, and changing class never drops them (docs/plans/2026-11-15-criacao-com-classe.md,
 * "Identidade das escolhas"). The sheet, the server and the creation form all read through here.
 */

/** One of the class's choices, as `classDefaults` lists them. */
export type ClassChoice = ClassDefaults['choices'][number];

/** What the sheet stores: the ids picked, by the choice's identity. Never the class default. */
export type ClassChoiceSelections = Record<string, string[]>;

/**
 * The SRD 5.1 tools of each kind a class lets the player pick from, by item id. Instruments are
 * every item of category `instrument`. Artisan's tools are the SRD's "Artisan's Tools" list: the
 * items only say `tool`, which also covers kits and gaming sets, so they are named one by one.
 */
export const TOOL_KIND_ITEMS: Record<string, readonly string[]> = {
  'musical-instrument': [
    'bagpipes',
    'drum',
    'dulcimer',
    'flute',
    'horn',
    'lute',
    'lyre',
    'pan-flute',
    'shawm',
    'viol',
  ],
  'artisan-tools': [
    'alchemist-s-supplies',
    'brewer-s-supplies',
    'calligrapher-s-supplies',
    'carpenter-s-tools',
    'cartographer-s-tools',
    'cobbler-s-tools',
    'cook-s-utensils',
    'glassblower-s-tools',
    'jeweler-s-tools',
    'leatherworker-s-tools',
    'mason-s-tools',
    'painter-s-supplies',
    'potter-s-tools',
    'smith-s-tools',
    'tinker-s-tools',
    'weaver-s-tools',
    'woodcarver-s-tools',
  ],
};

/** Every id the choice lets the player pick: skill keys, or the tools of the kinds it names. */
export function choiceOptions(choice: Pick<ClassChoice, 'kind' | 'from'>): string[] {
  if (choice.kind === 'skills') return [...choice.from];
  return [...new Set(choice.from.flatMap((kind) => TOOL_KIND_ITEMS[kind] ?? []))];
}

/**
 * The picks that count for the choice: only listed ones, each once, and no more than it asks for
 * (the first ones picked). A skill marked for another reason is not a pick and never counts.
 */
export function countedSelections(
  choice: Pick<ClassChoice, 'kind' | 'from' | 'count'>,
  selected: readonly string[] | undefined,
): string[] {
  const options = new Set(choiceOptions(choice));
  return [...new Set(selected ?? [])].filter((id) => options.has(id)).slice(0, choice.count);
}

/**
 * What a new sheet keeps of the picks it was sent: the counted ones of each of the class's
 * choices, under that choice's identity. Picks for a choice the class doesn't have are left out,
 * and so is a choice with nothing picked.
 */
export function acceptedSelections(
  choices: readonly ClassChoice[],
  selections: Readonly<Record<string, readonly string[]>> | undefined,
): ClassChoiceSelections {
  return Object.fromEntries(
    choices
      .map((choice) => [choice.key, countedSelections(choice, selections?.[choice.key])] as const)
      .filter(([, picked]) => picked.length > 0),
  );
}

/** A choice of the sheet's class still waiting for picks, as the sheet's notice shows it. */
export interface PendingChoice {
  choice: ClassChoice;
  /** The picks that count so far (`countedSelections`). */
  picked: string[];
  /** How many are still to pick: at least 1. */
  open: number;
}

/**
 * The class's choices with fewer counted picks than it asks for and not dismissed. Worked out on
 * every read, never stored: only the dismissals are (by the choice's identity), so dismissing the
 * Bard's skills leaves the Rogue's open, and going back to the Bard finds them dismissed.
 */
export function pendingChoices(
  choices: readonly ClassChoice[],
  selections: Readonly<Record<string, readonly string[]>> | undefined,
  dismissed: readonly string[] | undefined,
): PendingChoice[] {
  const off = new Set(dismissed ?? []);
  return choices
    .filter((choice) => !off.has(choice.key))
    .map((choice) => {
      const picked = countedSelections(choice, selections?.[choice.key]);
      return { choice, picked, open: choice.count - picked.length };
    })
    .filter(({ open }) => open > 0);
}

/** Identity of a choice: `<edition>/<class>/<choice>`, all ids. */
export const CHOICE_KEY = /^\d{4}\/[a-z0-9-]+\/[a-z0-9-]+$/;
