import type { Edition } from '@shared/systems/dnd5e/content/editions';

export interface SpellDto {
  /** Stable content key, e.g. `dnd5e:srd-5.1:spell:fireball`. */
  id: string;
  edition: Edition;
  /** The description isn't in the requested language yet and shows in English. */
  untranslated: boolean;
  name: string;
  level: number;
  school: string;
  classes: string[];
  components: string[];
  durationUnit?: string | null;
  durationValue?: number | null;
  rangeUnit?: string | null;
  rangeValue?: number | null;
  castingTime?: string | null;
  castingValue?: number | null;
  concentration?: boolean;
  ritual?: boolean;
  materialCost?: number;
  isScaling?: boolean;
  description?: string;
  higherLevel?: string | null;
  material?: string | null;
  damageType?: 'fire' | 'lightning' | 'acid' | 'cold' | 'necrotic' | 'radiant' | 'force' | string;
  spellCategory?: string;
  bgStyleId?: string | null;
}

export interface FindSpellsParams {
  locale?: string;
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  school?: string;
  class?: string;
  damageType?: string;
  edition?: Edition;
}

export interface PaginatedSpells {
  data: SpellDto[];
  total: number;
}

export interface SpellsRepo {
  findAll(params?: FindSpellsParams): Promise<PaginatedSpells>;
  /** The spells with these keys, in the same order; unknown keys are left out. */
  findByKeys(keys: string[], locale?: string): Promise<SpellDto[]>;
}
