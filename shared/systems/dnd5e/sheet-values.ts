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

/** Only a sheet explicitly set to 2014 gets SRD 5.1 class defaults: none yet, or 2024, stays manual. */
export function followsSrd2014(edition: Edition | undefined): boolean {
  return edition === '2014';
}
