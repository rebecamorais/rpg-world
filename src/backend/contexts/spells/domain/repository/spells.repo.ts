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
}

export interface SpellsRepo {
  findAll(locale?: string): Promise<SpellDto[]>;
}
