import type { Edition } from '@shared/systems/dnd5e/content/editions';

export interface ConditionDto {
  /** Stable content key, e.g. `dnd5e:srd-5.2:condition:prone`. */
  key: string;
  /** Short id inside its book, e.g. `prone`. */
  id: string;
  edition: Edition;
  name: string;
  description: string;
  /** Only exhaustion has levels (1 to `maxLevel`). */
  maxLevel: number | null;
  /** The description isn't in the requested language yet and shows in English. */
  untranslated: boolean;
}

export interface ConditionCatalog {
  /** Every condition of every book, by edition and then name. */
  list(locale?: string): ConditionDto[];
  find(key: string): ConditionDto | null;
}
