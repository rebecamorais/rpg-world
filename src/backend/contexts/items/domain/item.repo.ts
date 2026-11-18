import type { Edition } from '@shared/systems/dnd5e/content/editions';
import type { ItemCategory } from '@shared/systems/dnd5e/content/item.schema';

export interface ItemDto {
  /** Stable content key, e.g. `dnd5e:srd-5.2:item:rope-hempen`. */
  key: string;
  /** Short id inside its book, e.g. `rope-hempen`. */
  id: string;
  edition: Edition;
  category: ItemCategory;
  name: string;
  description: string | null;
  /** Price in copper pieces; may be fractional (some ammunition). */
  value: number | null;
  /** Weight in pounds. */
  weight: number | null;
  strength: number | null;
  stealthDisadvantage: boolean;
  ac: number | null;
  damage: { dice: string; type: string } | null;
  versatile: string | null;
  properties: string[];
  range: string | null;
  /** The name or description isn't in the requested language yet and shows in English. */
  untranslated: boolean;
}

export interface ItemCatalog {
  /** Every item of every book, by edition and then name. */
  list(locale?: string): ItemDto[];
  find(key: string): ItemDto | null;
  /** The known items, in the order of `keys`; unknown keys are skipped. */
  findByKeys(keys: string[], locale?: string): ItemDto[];
}
