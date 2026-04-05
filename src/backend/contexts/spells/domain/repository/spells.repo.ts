export interface SpellDto {
  id: string;
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
}

export interface PaginatedSpells {
  data: SpellDto[];
  total: number;
}

export interface SpellsRepo {
  findAll(params?: FindSpellsParams): Promise<PaginatedSpells>;
}
