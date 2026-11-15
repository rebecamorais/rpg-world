import type { Edition } from './content/editions';

/*
 * How a value the class gives lives on the sheet (docs/class-sheet-map.md, "Contrato de valores"):
 * the SRD default is computed and never stored, what the player changed on purpose is stored apart
 * as an adjustment, and what gets spent is stored as the player left it.
 */

/** What the player changed on purpose, one per item (a saving throw, a spell level, a proficiency). */
export interface Adjustment<T> {
  value: T;
  /** Following the SRD again: the value is kept, so it can come back. */
  off?: true;
}

/** The adjustment while it is on, else the SRD default. Never guessed by comparing the two. */
export function effectiveValue<T>(srdDefault: T, adjustment: Adjustment<T> | undefined): T;
export function effectiveValue<T>(
  srdDefault: T | undefined,
  adjustment: Adjustment<T> | undefined,
): T | undefined;
export function effectiveValue<T>(
  srdDefault: T | undefined,
  adjustment: Adjustment<T> | undefined,
): T | undefined {
  return adjustment && !adjustment.off ? adjustment.value : srdDefault;
}

/** Turns an adjustment off (follow the SRD) or back on, keeping its value either way. */
export function switchAdjustment<T>(adjustment: Adjustment<T>, on: boolean): Adjustment<T> {
  return on ? { value: adjustment.value } : { value: adjustment.value, off: true };
}

/**
 * What was spent, as the sheet shows it: the saved number within today's maximum. A maximum that
 * drops (a level down, an attribute lower) limits what shows and leaves the saved number alone,
 * so going back up brings the sheet back as it was.
 */
export function effectiveState(saved: number | undefined, max: number): number {
  return Math.min(Math.max(saved ?? 0, 0), Math.max(max, 0));
}

/**
 * What the class fills in on a sheet, and for which editions each part was checked against its
 * SRD (docs/class-sheet-coverage.md). An edition is added to a part only once that part was
 * verified for it: 2024 never gets a 2014 rule by default. A sheet with no edition follows nothing.
 */
export const CLASS_AUTOMATION = {
  savingThrows: ['2014', '2024'],
  hitDie: ['2014', '2024'],
  proficiencies: ['2014'],
  skillChoices: ['2014'],
  spellProgression: ['2014'],
} as const satisfies Record<string, readonly Edition[]>;

export type ClassAutomation = keyof typeof CLASS_AUTOMATION;

/** Whether a sheet of this edition gets that part from its class. */
export function followsClass(part: ClassAutomation, edition: Edition | undefined): boolean {
  return edition !== undefined && (CLASS_AUTOMATION[part] as readonly Edition[]).includes(edition);
}

/** Whether a sheet of this edition gets everything the class fills in: only 2014 so far. */
export function followsClassFully(edition: Edition | undefined): boolean {
  return (Object.keys(CLASS_AUTOMATION) as ClassAutomation[]).every((part) =>
    followsClass(part, edition),
  );
}
